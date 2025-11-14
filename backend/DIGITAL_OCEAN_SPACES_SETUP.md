# Digital Ocean Spaces Setup Guide

## Step 1: Create a Digital Ocean Space

1. **Log in to Digital Ocean** and go to **Spaces** from the left sidebar
2. **Click "Create a Space"**
3. **Choose a region** (e.g., tor1, SFO3, SGP1, FRA1, AMS3)
   - Choose the region closest to your users for better performance
4. **Set the name** (e.g., `flyporterbucket`)
5. **Configure File Listing**:
   - Choose **"Restrict File Listing"** (recommended for security)
6. **CDN (Optional)**:
   - You can enable CDN for faster delivery
   - If enabled, you'll get a CDN URL to use in `SPACES_CDN_BASE_URL`
7. **Click "Create a Space"**

## Step 2: Generate Access Keys

1. In the Spaces section, click on **"Manage Keys"** or go to **API → Spaces access keys**
2. Click **"Generate New Key"**
3. **Name your key** (e.g., "FlyPorter Backend")
4. **Save the credentials**:
   - Access Key (like: `DO00XXXXXXXXXXXXX`)
   - Secret Key (like: `xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`)
   
   ⚠️ **Important**: Save these immediately! The secret key won't be shown again.

## Step 3: Configure Environment Variables

Copy `.env.example` to `.env` if you haven't already:

```bash
cp .env.example .env
```

Update the following variables in your `.env` file:

```bash
# Replace with your Space's region
SPACES_ENDPOINT="https://tor1.digitaloceanspaces.com"
SPACES_REGION="tor1"

# Add your access credentials
SPACES_ACCESS_KEY="DO00XXXXXXXXXXXXX"
SPACES_SECRET_KEY="xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"

# Your Space name
SPACES_BUCKET="flyporterbucket"

# We don't enabled CDN but if in the future we enable CDN # 
SPACES_CDN_BASE_URL="https://flyporterbucket.tor1.cdn.digitaloceanspaces.com"

# Directory structure for invoices
SPACES_INVOICE_PREFIX="invoices"
```

### Digital Ocean Regions and Endpoints

| Region | Endpoint |
|--------|----------|
| New York 3 | `https://tor1.digitaloceanspaces.com` |
| San Francisco 3 | `https://sfo3.digitaloceanspaces.com` |
| Singapore 1 | `https://sgp1.digitaloceanspaces.com` |
| Frankfurt 1 | `https://fra1.digitaloceanspaces.com` |
| Amsterdam 3 | `https://ams3.digitaloceanspaces.com` |

## Step 4: Set File Permissions (CORS)

If your frontend needs to access files directly, configure CORS:

1. Go to your Space in the Digital Ocean dashboard
2. Click on **Settings** tab
3. Scroll to **CORS Configurations**
4. Add a CORS rule:

```json
{
  "AllowedOrigins": ["https://yourdomain.com", "http://localhost:5173"],
  "AllowedMethods": ["GET", "HEAD"],
  "AllowedHeaders": ["*"],
  "MaxAgeSeconds": 3000
}
```

## Step 5: Test the Integration

### Test 1: Generate and Download PDF (Local)

```bash
# Login first to get a JWT token
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password"}'

# Use the token to download invoice
curl -X GET http://localhost:3000/api/pdf/invoice/1 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  --output invoice.pdf
```

### Test 2: Upload to Digital Ocean Spaces

```bash
# Upload invoice to DO Spaces and get URL
curl -X POST http://localhost:3000/api/pdf/invoice/1/upload \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json"

# Expected response:
{
  "success": true,
  "message": "Invoice uploaded successfully",
  "data": {
    "key": "invoices/booking-1-1699999999999.pdf",
    "bucket": "flyporterbucket",
    "url": "https://flyporterbucket.tor1.digitaloceanspaces.com/invoices/booking-1-1699999999999.pdf"
  }
}
```

## Step 6: Frontend Integration

📚 **For detailed frontend integration guide, see:**
**`../frontend/PDF_INVOICE_INTEGRATION.md`**

The frontend guide includes:
- Complete React/TypeScript examples
- API service layer implementation
- Error handling and retry logic
- Mobile device considerations (iOS Safari)
- Loading states and UX best practices
- Security considerations
- Testing examples

### Quick Example:

```typescript
// Upload to Spaces and get signed URL
const response = await fetch(
  `${API_URL}/api/pdf/invoice/${bookingId}/upload`,
  {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  }
);

const { data } = await response.json();

// Use the signed URL (valid for 1 hour)
window.open(data.url, '_blank'); // Opens PDF in new tab
```

**Key Points:**
- Signed URLs expire in **1 hour**
- Always include `Authorization` header with JWT token
- User must own the booking or be an admin
- Handle errors gracefully (401, 404, 500)

For complete implementation details, code examples, and best practices, refer to the frontend integration guide.

## Architecture Overview

```
┌─────────────┐         ┌─────────────┐         ┌──────────────────┐
│   Frontend  │  POST   │   Backend   │  PUT    │ Digital Ocean    │
│             ├────────>│   Server    ├────────>│ Spaces           │
│             │ /upload │             │ S3 API  │                  │
└─────────────┘         └─────────────┘         └──────────────────┘
                              │
                              │ Returns URL
                              ▼
                        ┌─────────────┐
                        │   Frontend  │
                        │ Downloads   │
                        │ from URL    │
                        └─────────────┘
```

## Security Considerations

1. **ACL Settings**: Currently set to `private` in the code
   - Files are not publicly accessible
   - You may need signed URLs for access (not implemented yet)
   
2. **Alternative**: Change ACL to `public-read` for simple access:
   ```typescript
   // In pdf.service.ts, line 317
   ACL: "public-read",  // Instead of "private"
   ```

3. **Best Practice**: Implement presigned URLs for temporary access
   - More secure than public-read
   - Files remain private but accessible with time-limited URLs

## Troubleshooting

### Error: "Spaces configuration is incomplete"
- Check all required environment variables are set
- Verify no extra spaces or quotes in `.env` file

### Error: "Access Denied"
- Verify your Access Key and Secret Key are correct
- Check that the Space name matches exactly
- Ensure the keys have permissions to write to Spaces

### Files not accessible
- Check ACL settings (private vs public-read)
- Verify CORS configuration if accessing from browser
- Check Space's file listing settings

### Wrong URLs generated
- Verify `SPACES_ENDPOINT` matches your region
- Ensure `SPACES_BUCKET` is correctly set
- If using CDN, set `SPACES_CDN_BASE_URL`



