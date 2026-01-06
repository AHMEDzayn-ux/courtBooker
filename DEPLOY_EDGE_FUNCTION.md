# Quick Deployment Commands

## Step 1: Login (Run this and it will open your browser)

```powershell
npx supabase@latest login
```

- Press Enter when prompted
- Browser will open - login to your Supabase account
- Close browser after successful login

## Step 2: Link Project

```powershell
npx supabase@latest link --project-ref YOUR_PROJECT_REF
```

Replace `YOUR_PROJECT_REF` with your actual project reference from Supabase dashboard (Settings → General → Reference ID)

## Step 3: Set Environment Secrets

```powershell
npx supabase@latest secrets set SMS_GATEWAY_BASE_URL=https://api.textbee.dev/api/v1
npx supabase@latest secrets set SMS_API_KEY=your_textbee_api_key
npx supabase@latest secrets set SMS_DEVICE_ID=your_device_id
```

Replace with your actual TextBee API credentials:

- Get API_KEY from TextBee dashboard
- Get DEVICE_ID from your connected Android device in TextBee

## Step 4: Deploy Function

```powershell
npx supabase@latest functions deploy send-booking-sms
```

## Step 5: Test Function

```powershell
npx supabase@latest functions invoke send-booking-sms --body '{\"type\":\"INSERT\",\"record\":{\"id\":\"test\",\"reference_id\":\"BK12345678\",\"customer_phone\":\"+94771234567\",\"booking_date\":\"2026-01-06\",\"start_time\":\"10:00:00\",\"total_price\":1500,\"status\":\"confirmed\"}}'
```

---

## Alternative: Deploy via Supabase Dashboard

If CLI doesn't work, you can deploy via dashboard:

1. Go to https://supabase.com/dashboard/project/YOUR_PROJECT/functions
2. Click "Deploy a new function"
3. Name: `send-booking-sms`
4. Copy-paste contents from `supabase/functions/send-booking-sms/index.ts`
5. Add environment variables in Settings tab:
   - `SMS_GATEWAY_BASE_URL` = https://api.textbee.dev/api/v1
   - `SMS_API_KEY` = your_textbee_api_key
   - `SMS_DEVICE_ID` = your_device_id
6. Click Deploy

Then create webhooks in Database → Webhooks:

- Event: INSERT and UPDATE on `bookings` table
- URL: Your deployed function URL
- Header: `Authorization: Bearer YOUR_ANON_KEY`
