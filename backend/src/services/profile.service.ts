import { prisma } from "../config/prisma.js";

export interface ProfileData {
    user_id: number;
    email: string;
    role: string;
    created_at: Date;
    updated_at: Date;
    customer_info?: {
        info_id: number;
        full_name: string;
        phone: string | null;
        passport_number: string;
        date_of_birth: Date;
        emergency_contact_name: string | null;
        emergency_contact_phone: string | null;
    } | null;
}

export interface UpdateProfileInput {
    email?: string;
    full_name?: string;
    phone?: string | null;
    passport_number?: string;
    date_of_birth?: Date;
    emergency_contact_name?: string | null;
    emergency_contact_phone?: string | null;
}

/**
 * Get user profile with customer info
 */
export async function getProfile(userId: number): Promise<ProfileData | null> {
    return prisma.user.findUnique({
        where: { user_id: userId },
        select: {
            user_id: true,
            email: true,
            role: true,
            created_at: true,
            updated_at: true,
            customer_info: {
                select: {
                    info_id: true,
                    full_name: true,
                    phone: true,
                    passport_number: true,
                    date_of_birth: true,
                    emergency_contact_name: true,
                    emergency_contact_phone: true,
                },
            },
        },
    });
}

/**
 * Update user profile (User + CustomerInfo)
 * This updates both the User table (email) and CustomerInfo table (other fields)
 */
export async function updateProfile(userId: number, input: UpdateProfileInput) {
    const { email, ...customerFields } = input;

    // Start a transaction to update both tables
    return prisma.$transaction(async (tx) => {
        // Update User table if email is provided
        let updatedUser;
        if (email !== undefined) {
            updatedUser = await tx.user.update({
                where: { user_id: userId },
                data: {
                    email,
                    updated_at: new Date(),
                },
                select: {
                    user_id: true,
                    email: true,
                    role: true,
                    created_at: true,
                    updated_at: true,
                },
            });
        } else {
            updatedUser = await tx.user.findUnique({
                where: { user_id: userId },
                select: {
                    user_id: true,
                    email: true,
                    role: true,
                    created_at: true,
                    updated_at: true,
                },
            });
        }

        // Update CustomerInfo if any customer fields are provided
        let customerInfo = null;
        const customerFieldEntries = Object.entries(customerFields).filter(([, value]) => value !== undefined);

        if (customerFieldEntries.length > 0) {
            const existing = await tx.customerInfo.findUnique({
                where: { user_id: userId },
            });

            const customerData = Object.fromEntries(customerFieldEntries);

            const select = {
                info_id: true,
                full_name: true,
                phone: true,
                passport_number: true,
                date_of_birth: true,
                emergency_contact_name: true,
                emergency_contact_phone: true,
            } as const;

            if (existing) {
                customerInfo = await tx.customerInfo.update({
                    where: { user_id: userId },
                    data: customerData,
                    select,
                });
            } else {
                const requiredFields: Array<keyof typeof customerData> = [
                    "full_name",
                    "passport_number",
                    "date_of_birth",
                ];
                const missingRequired = requiredFields.filter(
                    (field) => customerData[field] === undefined
                );

                if (missingRequired.length > 0) {
                    throw new Error(
                        "full_name, passport_number, and date_of_birth are required to create passenger information"
                    );
                }

                customerInfo = await tx.customerInfo.create({
                    data: {
                        user_id: userId,
                        full_name: customerData.full_name as string,
                        passport_number: customerData.passport_number as string,
                        date_of_birth: customerData.date_of_birth as Date,
                        phone: (customerData.phone as string | null | undefined) ?? null,
                        emergency_contact_name:
                            (customerData.emergency_contact_name as string | null | undefined) ?? null,
                        emergency_contact_phone:
                            (customerData.emergency_contact_phone as string | null | undefined) ?? null,
                    },
                    select,
                });
            }
        } else {
            customerInfo = await tx.customerInfo.findUnique({
                where: { user_id: userId },
                select: {
                    info_id: true,
                    full_name: true,
                    phone: true,
                    passport_number: true,
                    date_of_birth: true,
                    emergency_contact_name: true,
                    emergency_contact_phone: true,
                },
            });
        }

        return {
            ...updatedUser,
            customer_info: customerInfo,
        };
    });
}

