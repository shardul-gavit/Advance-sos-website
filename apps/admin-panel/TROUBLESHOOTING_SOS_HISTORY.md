# 🔧 Troubleshooting: SOS History Dashboard - No Past Triggers

## ✅ Fixes Applied

### 1. **Column Name Fix**
- ✅ Changed query from `triggered_at` → `created_at` 
- ✅ Added fallback to try both column names automatically
- ✅ Updated data mapping to handle both column names

### 2. **Enhanced Error Handling**
- ✅ Added detailed logging for debugging
- ✅ Added diagnostics tool to check database structure
- ✅ Added fallback direct query if service fails

### 3. **Improved Filtering**
- ✅ Added "Active" and "Pending" status filter options
- ✅ Improved status matching logic (case-insensitive)

## 🔍 Diagnostic Steps

### Step 1: Run Diagnostics Button
1. Go to **SOS History Dashboard**
2. Click the **"Diagnostics"** button (purple button next to Refresh)
3. Check the alert popup and browser console for results
4. This will show:
   - Which tables exist in your database
   - How many records are in `sos_alerts`
   - What columns are available
   - Any query errors

### Step 2: Check Browser Console
Open browser console (F12) and look for:
- `📊 Fetched X alerts from database`
- `📈 Loaded X SOS alerts for history`
- Any error messages in red

### Step 3: Verify Database Connection
Check if you can access the database:
```javascript
// In browser console
const { supabase } = await import('./lib/supabase');
const { data, error } = await supabase.from('sos_alerts').select('count').limit(1);
console.log('Count:', data, 'Error:', error);
```

## 🚨 Common Issues & Solutions

### Issue 1: Table is Empty
**Symptom:** Diagnostics shows table exists but count is 0

**Solution:**
- Check if you have any SOS alerts in your database
- Try creating a test alert to verify the system works
- Check if alerts are being created in a different table

### Issue 2: Column Name Mismatch
**Symptom:** Error about column not existing

**Solution:**
- The code now automatically tries both `created_at` and `triggered_at`
- Check diagnostics to see which column exists
- If your database uses a different column name, update the query

### Issue 3: RLS (Row Level Security) Blocking Access
**Symptom:** Table exists but returns 0 records, no errors

**Solution:**
Run this SQL in Supabase SQL Editor:
```sql
-- Check RLS policies
SELECT * FROM pg_policies WHERE tablename = 'sos_alerts';

-- If needed, add policy for admin access
CREATE POLICY "Admin can view all sos_alerts" ON sos_alerts
FOR SELECT USING (true);
```

### Issue 4: Wrong Table Name
**Symptom:** Error "relation does not exist"

**Solution:**
- Use Diagnostics button to check which tables exist
- If `sos_alerts` doesn't exist, check if it's named differently
- Common alternatives: `sos_events`, `emergencies`, `alerts`

## 📋 Quick Verification Checklist

- [ ] Click "Diagnostics" button and check results
- [ ] Check browser console for errors
- [ ] Verify `sos_alerts` table exists
- [ ] Verify table has data (count > 0)
- [ ] Check RLS policies allow SELECT
- [ ] Verify column names (`created_at` or `triggered_at`)
- [ ] Check if filters are set to "All Status"

## 🎯 Next Steps

1. **Click the "Diagnostics" button** in SOS History Dashboard
2. **Check the results** - it will tell you:
   - Which tables exist
   - How many records are in `sos_alerts`
   - What the actual column structure is
3. **Share the diagnostics results** if issues persist

## 📝 Expected Behavior

After fixes:
- ✅ All past triggers should appear in the history
- ✅ Events should be sorted by date (newest first)
- ✅ Filters should work correctly
- ✅ "View in Map" button should work for each event

## 🔧 Manual SQL Check

If you have access to Supabase SQL Editor, run:

```sql
-- Check if table exists and has data
SELECT COUNT(*) as total_count FROM sos_alerts;

-- Check column names
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'sos_alerts' 
  AND column_name IN ('created_at', 'triggered_at', 'status', 'emergency_type');

-- Check recent alerts
SELECT id, status, emergency_type, created_at, triggered_at
FROM sos_alerts
ORDER BY COALESCE(created_at, triggered_at) DESC
LIMIT 10;
```

This will help identify the exact issue.

