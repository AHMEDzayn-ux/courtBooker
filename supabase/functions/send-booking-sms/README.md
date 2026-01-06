# Supabase Edge Function Configuration

This edge function sends SMS notifications for booking confirmations and cancellations.

## Setup

1. Deploy the function:

```bash
supabase functions deploy send-booking-sms
```

2. Set environment variables:

```bash
supabase secrets set SMS_GATEWAY_URL=your_android_gateway_url
supabase secrets set SMS_GATEWAY_TOKEN=your_token_if_needed
```

3. Create Database Webhook in Supabase Dashboard:
   - Go to Database → Webhooks
   - Create webhook for `bookings` table
   - Events: INSERT, UPDATE
   - URL: `https://YOUR_PROJECT_REF.supabase.co/functions/v1/send-booking-sms`
   - Add header: `Authorization: Bearer YOUR_ANON_KEY`

## Testing Locally

```bash
supabase functions serve send-booking-sms --env-file .env.local
```
