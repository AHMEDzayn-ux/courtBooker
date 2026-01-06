# SMS Notification Setup Guide

This guide will help you set up SMS notifications for booking confirmations and cancellations.

## Prerequisites

- Android SMS Gateway running
- Supabase CLI installed: `npm install -g supabase`

## Step 1: Run Database Migration

Execute the enhanced booking constraints SQL to add the `cancellation_reason` field:

```bash
# In Supabase Dashboard → SQL Editor, run:
```

Copy and paste the contents of `enhanced-booking-constraints.sql` and execute.

## Step 2: Deploy Edge Function

1. **Login to Supabase CLI:**

```bash
supabase login
```

2. **Link your project:**

```bash
supabase link --project-ref YOUR_PROJECT_REF
```

3. **Set environment secrets:**

```bash
supabase secrets set SMS_GATEWAY_URL=http://your-android-gateway-url/api/send
supabase secrets set SMS_GATEWAY_TOKEN=your_optional_token
```

4. **Deploy the function:**

```bash
supabase functions deploy send-booking-sms
```

## Step 3: Create Database Webhook

1. Go to **Supabase Dashboard → Database → Webhooks**

2. **Create Webhook #1 - Booking Confirmations:**

   - Name: `booking-confirmation-sms`
   - Table: `bookings`
   - Events: ☑️ `INSERT`
   - Type: `HTTP Request`
   - Method: `POST`
   - URL: `https://YOUR_PROJECT_REF.supabase.co/functions/v1/send-booking-sms`
   - HTTP Headers:
     - Key: `Authorization`
     - Value: `Bearer YOUR_ANON_KEY` (get from Settings → API)

3. **Create Webhook #2 - Cancellations:**
   - Name: `booking-cancellation-sms`
   - Table: `bookings`
   - Events: ☑️ `UPDATE`
   - Type: `HTTP Request`
   - Method: `POST`
   - URL: `https://YOUR_PROJECT_REF.supabase.co/functions/v1/send-booking-sms`
   - HTTP Headers:
     - Key: `Authorization`
     - Value: `Bearer YOUR_ANON_KEY`

## Step 4: Configure Your Android SMS Gateway

Ensure your Android SMS Gateway accepts POST requests with this format:

```json
{
  "message": "SMS message text",
  "recipient": "+94771234567"
}
```

And returns:

```json
{
  "smsId": "unique-id",
  "status": "sent",
  "recipient": "+94771234567"
}
```

## Step 5: Test the Integration

### Test Booking Confirmation:

1. Make a booking through the website
2. Check if SMS is received
3. Check Edge Function logs:
   ```bash
   supabase functions logs send-booking-sms
   ```

### Test Cancellation:

1. Go to Dashboard → Bookings
2. Click "Cancel" on a booking
3. Enter a reason (e.g., "Maintenance work scheduled")
4. Confirm cancellation
5. Customer should receive SMS with the reason

## SMS Message Templates

### Confirmation SMS:

```
✅ Booking Confirmed!

Ref: BK12345678
Court Name - Court A
Badminton
📅 Jan 6, 2026
⏰ 10:00-11:00
💰 LKR 1500.00

Thank you for booking with us!
```

### Cancellation SMS:

```
❌ Booking Cancelled

Ref: BK12345678
Reason: Maintenance work scheduled

For queries, please contact the institution. Any payments will be processed according to cancellation policy.
```

## Troubleshooting

### SMS Not Sending:

1. **Check Edge Function Logs:**

   ```bash
   supabase functions logs send-booking-sms --tail
   ```

2. **Test Edge Function Directly:**

   ```bash
   curl -X POST \
     https://YOUR_PROJECT_REF.supabase.co/functions/v1/send-booking-sms \
     -H "Authorization: Bearer YOUR_ANON_KEY" \
     -H "Content-Type: application/json" \
     -d '{
       "type": "INSERT",
       "record": {
         "id": "test-id",
         "reference_id": "BK12345678",
         "customer_phone": "+94771234567",
         "booking_date": "2026-01-06",
         "start_time": "10:00:00",
         "total_price": 1500,
         "status": "confirmed"
       }
     }'
   ```

3. **Check Environment Variables:**

   ```bash
   supabase secrets list
   ```

4. **Verify Webhook Created:**
   - Go to Supabase Dashboard → Database → Webhooks
   - Check if webhooks are enabled and active

### Android Gateway Issues:

1. Ensure Android device is online
2. Check gateway app is running
3. Verify the gateway URL is accessible from Supabase servers
4. Test gateway directly with curl/Postman

## Local Development

To test locally before deploying:

1. **Create `.env.local` file:**

```
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
SMS_GATEWAY_URL=http://your-local-gateway:port
SMS_GATEWAY_TOKEN=your_token
```

2. **Run function locally:**

```bash
supabase functions serve send-booking-sms --env-file .env.local
```

3. **Test with sample data:**

```bash
curl -X POST \
  http://localhost:54321/functions/v1/send-booking-sms \
  -H "Content-Type: application/json" \
  -d '{
    "type": "INSERT",
    "record": {
      "id": "test-id",
      "reference_id": "BK12345678",
      "customer_phone": "+94771234567",
      "booking_date": "2026-01-06",
      "start_time": "10:00:00",
      "total_price": 1500,
      "status": "confirmed"
    }
  }'
```

## Cost Considerations

- **Edge Function Invocations:** Free tier includes 500K requests/month
- **Database Webhooks:** Unlimited on all plans
- **SMS Costs:** Depends on your Android gateway provider

## Security Best Practices

1. ✅ Never commit secrets to git
2. ✅ Use environment variables for sensitive data
3. ✅ Validate phone numbers before sending
4. ✅ Rate limit SMS sending if needed
5. ✅ Log all SMS attempts for auditing

## Future Enhancements

- Add SMS templates for different languages
- Implement retry logic for failed SMS
- Add SMS delivery status tracking
- Send reminder SMS before booking time
- Add email notifications alongside SMS
