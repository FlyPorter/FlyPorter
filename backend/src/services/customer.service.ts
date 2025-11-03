import { prisma } from "../config/prisma.js";

export interface CreateCustomerInput {
    user_id: number;
    full_name: string;
    phone?: string;
    passport_number: string;
    date_of_birth: Date;
    emergency_contact_name?: string;
    emergency_contact_phone?: string;
}

export interface UpdateCustomerInput {
    full_name?: string;
    phone?: string;
    passport_number?: string;
    date_of_birth?: Date;
    emergency_contact_name?: string;
    emergency_contact_phone?: string;
}

export async function createCustomer(input: CreateCustomerInput) {
    return prisma.customerInfo.create({
        data: input,
        // select: { user_id: true },
    });
}

export async function getCustomerByUserId(id: number) {
    return prisma.customerInfo.findUnique({
        where: {
            user_id: id,
        },
    })
}

export async function updateCustomer(id:number, input: UpdateCustomerInput) {
    return prisma.customerInfo.update({
        where: {
            user_id: id
        },
        data: input,
        // select: { info_id: true, user_id: true },

    })
}

export async function deleteCustomer(userId: number) {
    return prisma.customerInfo.delete({
        where: { user_id: userId },
        select: { info_id: true, user_id: true },
    });
}