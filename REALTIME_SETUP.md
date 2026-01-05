# Real-Time Booking System Setup Guide

This document explains how to enable real-time updates and concurrent booking protection for your ticket reservation system.

## Overview

The system now includes:

1. **Real-time Updates**: Instant slot availability updates when bookings are made
2. **Concurrent Booking Protection**: Prevents double-booking even when multiple users book simultaneously
3. **Database-Level Constraints**: Ensures data integrity at the database level

## Setup Instructions

### Step 1: Run Enhanced Database Migrations

Execute the SQL migration file to add enhanced booking constraints:

```bash
# Connect to your Supabase database and run:
psql -h [YOUR_SUPABASE_HOST] -U postgres -d postgres -f enhanced-booking-constraints.sql
```

Or copy the contents of `enhanced-booking-constraints.sql` and execute in Supabase SQL Editor:

1. Go to Supabase Dashboard → SQL Editor
2. Click "New Query"
3. Paste the contents of `enhanced-booking-constraints.sql`
4. Click "Run"

### Step 2: Enable Real-Time in Supabase Dashboard

1. Go to your Supabase project dashboard
2. Navigate to **Database → Replication**
3. Find the `bookings` table
4. Toggle the switch to enable real-time for the `bookings` table
5. Optionally enable real-time for `courts` table for court availability updates

### Step 3: Verify Database Functions

The migration creates these key database functions:

#### 1. `check_no_overlapping_bookings()` (Trigger Function)

- Automatically prevents overlapping bookings at database level
- Checks for time range overlaps, not just identical start times
- Runs BEFORE INSERT or UPDATE on bookings table

#### 2. `check_slot_available()` (Availability Check)

- Locks booking rows for the specific court and date
- Prevents race conditions during concurrent booking attempts
- Returns boolean indicating if slot is available

#### 3. `create_booking_atomic()` (Atomic Booking Creation)

- Combines availability check and booking creation in one transaction
- Uses row-level locking to prevent concurrent double-bookings
- Returns success status, booking ID, and reference ID

## How It Works

### Concurrent Booking Prevention

When two users try to book the same slot simultaneously:

1. **User A** calls the booking API
   - `create_booking_atomic()` function locks the relevant booking rows
   - Checks slot availability
   - Creates booking if available
2. **User B** calls the booking API at the same time
   - Function waits for User A's lock to release
   - Checks availability (now shows as booked)
   - Returns error: "Time slot is no longer available"

### Real-Time Updates

When a booking is created/updated/cancelled:

1. Database trigger executes the change
2. Supabase broadcasts change via WebSocket to all subscribed clients
3. TimeSlotSelector components listening to that court/date receive update
4. Frontend automatically refreshes slot availability
5. Users see updated availability without manual refresh

### Component Integration

#### TimeSlotSelector Component

```javascript
// Subscribes to real-time changes for specific court and date
const channel = supabase.channel(`bookings:court_${courtId}:date_${date}`).on(
  "postgres_changes",
  {
    table: "bookings",
    filter: `court_id=eq.${courtId}`,
  },
  (payload) => {
    // Refresh bookings when change detected
    fetchBookings();
  }
);
```

#### Dashboard Bookings Page

```javascript
// Subscribes to all bookings for the institution
const channel = supabase.channel(`institution_bookings:${institutionId}`).on(
  "postgres_changes",
  {
    table: "bookings",
    filter: `institution_id=eq.${institutionId}`,
  },
  (payload) => {
    // Refresh booking list
    fetchBookings();
  }
);
```

## API Changes

### Before (Race Condition Vulnerable)

```javascript
// Check availability
const isAvailable = await checkAvailability();

// Time gap here - another user could book!

// Create booking
await createBooking();
```

### After (Atomic & Safe)

```javascript
// Single atomic operation with locking
const result = await supabase.rpc("create_booking_atomic", {
  p_court_id: courtId,
  p_booking_date: date,
  // ... other params
});

// Returns success/failure with appropriate error message
```

## Testing Concurrent Bookings

To test the double-booking prevention:

1. Open the same court booking page in two different browsers
2. Select the same date and time slot in both
3. Click "Book Now" simultaneously in both browsers
4. Result: One succeeds, the other gets "Time slot is no longer available" error

## Real-Time Testing

To test real-time updates:

1. Open the same court page in two browsers
2. In Browser A, book a time slot
3. Browser B should automatically show that slot as unavailable within 1-2 seconds
4. No page refresh needed!

## Troubleshooting

### Real-Time Not Working

1. **Check Supabase Replication Settings**

   - Ensure `bookings` table has replication enabled
   - Check Database → Replication in Supabase dashboard

2. **Check Browser Console**

   - Look for "Real-time subscription status: SUBSCRIBED"
   - If you see "CLOSED" or errors, check your Supabase connection

3. **Check Network Tab**
   - Should see WebSocket connection to Supabase
   - Status should be "101 Switching Protocols"

### Concurrent Booking Errors

1. **Check Database Functions**

   ```sql
   -- Verify functions exist
   SELECT routine_name FROM information_schema.routines
   WHERE routine_schema = 'public'
   AND routine_name IN ('check_slot_available', 'create_booking_atomic');
   ```

2. **Check Trigger**

   ```sql
   -- Verify trigger exists
   SELECT trigger_name FROM information_schema.triggers
   WHERE event_object_table = 'bookings';
   ```

3. **Check Logs**
   - Supabase Dashboard → Logs → Postgres Logs
   - Look for constraint violations or lock timeouts

## Performance Considerations

### Database Indexes

The system uses these indexes for optimal performance:

- `idx_bookings_court_date`: Fast lookups for court/date combinations
- `idx_bookings_reference`: Fast reference ID lookups
- `idx_bookings_institution`: Fast institution booking queries

### Real-Time Subscription Cleanup

Always unsubscribe from channels when components unmount:

```javascript
useEffect(() => {
  const channel = setupSubscription();
  return () => {
    channel.unsubscribe();
  };
}, []);
```

## Security

### Row Level Security (RLS)

All operations respect existing RLS policies:

- Public users can view confirmed bookings (for availability)
- Institution admins can view/manage their bookings
- All booking creation goes through proper validation

### Database-Level Validation

- Overlapping booking prevention runs at database level
- Cannot be bypassed by API or client-side code
- Ensures data integrity even if application code has bugs

## Monitoring

Track booking system health:

1. **Failed Booking Attempts**

   ```sql
   -- Monitor failed bookings in application logs
   -- Look for "Time slot is no longer available" errors
   ```

2. **Real-Time Connection Status**

   - Check Supabase Dashboard → Realtime
   - Monitor active connections and message rates

3. **Database Lock Contention**
   ```sql
   -- Check for lock waits
   SELECT * FROM pg_stat_activity
   WHERE wait_event_type = 'Lock';
   ```

## Support

For issues or questions:

1. Check Supabase logs in dashboard
2. Review browser console for client-side errors
3. Verify database migration completed successfully
4. Test with Supabase SQL Editor for database-level issues
