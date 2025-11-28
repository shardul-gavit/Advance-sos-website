# Database Schema Synchronization Changes

This document logs all changes made to sync the admin panel with the actual PostgreSQL database schema.

## Date: 2024-01-XX

## Summary
Updated all database models, type definitions, API services, and UI components to match the authoritative PostgreSQL schema.

---

## 1. Users Table Updates

### File: `apps/admin-panel/src/lib/supabase.ts`

**Added Fields:**
- `full_name` (string | null)
- `phone_number` (string | null)
- `emergency_contact_name` (string | null)
- `emergency_contact_phone` (string | null)
- `emergency_contact_relationship` (string | null)
- `is_active` (boolean)
- `onboarding_completed` (boolean)
- `personal_info_completed` (boolean)
- `pin_created` (boolean)
- `permissions_granted` (boolean)
- `latitude` (number | null)
- `longitude` (number | null)
- `user_type` (string | null)
- `is_available` (boolean | null)
- `emergency_preferences` (any | null)
- `device_info` (any | null)
- `last_activity` (string | null)
- `fcm_token` (string | null)
- `role` (string | null)
- `blood_group` (string | null)
- `date_of_birth` (string | null)
- `address` (string | null)
- `emergency_notes` (string | null)
- `last_active_at` (string | null)

**Reason:** The users table in the database contains many more fields than were previously defined in the TypeScript types.

---

## 2. SOS Alerts Table Updates

### File: `apps/admin-panel/src/lib/supabase.ts`
### File: `apps/admin-panel/src/types/sos.ts`

**Added Fields:**
- `city` (string | null)
- `country` (string | null)
- `severity` (string | null)
- `last_status_message` (string | null)
- `last_media_update` (string | null)
- `last_status_update` (string | null)
- `resolution_notes` (string | null)
- `resolved_by` (string | null)
- `device_info` (any | null)
- `app_version` (string | null)

**Removed Fields:**
- `assigned_helper_id` (moved to legacy compatibility)
- `assigned_responder_id` (moved to legacy compatibility)

**Reason:** The sos_alerts table schema includes additional tracking and metadata fields that were missing.

---

## 3. SOS Media Table Updates

### File: `apps/admin-panel/src/lib/supabase.ts`
### File: `apps/admin-panel/src/types/media.ts`
### File: `apps/admin-panel/src/lib/services/sosDataService.ts`

**Table Name Changed:** `media` → `sos_media`

**Added Fields:**
- `sos_id` (string | null)
- `chunk_url` (string | null)
- `timestamp` (string | null)
- `chunk_sequence` (number | null)
- `file_size_bytes` (number | null)
- `camera_type` (string | null)
- `is_uploaded` (boolean | null)
- `media_data` (any | null)
- `chunk_number` (number | null)
- `chunk_size` (number | null)
- `media_type` (string | null)
- `metadata` (any | null)

**Updated Services:**
- `mediaService.getMediaForSOSEvent()` now queries `sos_media` table
- Updated to check both `sos_event_id` and `sos_id` fields
- Updated realtime subscription to use `sos_media` table

**Reason:** The actual table is named `sos_media` and includes chunking support and additional metadata fields.

---

## 4. Emergency Contacts Table Updates

### File: `apps/admin-panel/src/lib/supabase.ts`
### File: `apps/admin-panel/src/types/sos.ts`
### File: `apps/admin-panel/src/lib/services/api.ts`

**Added Fields:**
- `phone_number` (string) - primary field
- `email` (string | null)
- `updated_at` (string)

**Updated API:**
- `getEmergencyContacts()` now maps `phone_number` to `phone` for backward compatibility

**Reason:** The schema uses `phone_number` as the primary field name, with `phone` as a legacy alias.

---

## 5. New Tables Added

### SOS Status History Table

### File: `apps/admin-panel/src/lib/supabase.ts`
### File: `apps/admin-panel/src/lib/services/api.ts`

**New Table:** `sos_status_history`

**Fields:**
- `id` (string)
- `sos_event_id` (string)
- `user_id` (string)
- `status` (string)
- `previous_status` (string | null)
- `message` (string | null)
- `source` (string | null)
- `created_at` (string)

**New Service Method:**
- `APIService.getSOSStatusHistory(sosEventId)` - fetches status history for an SOS event

**Reason:** This table tracks status changes for SOS alerts and was missing from the codebase.

---

### Admin Feed Table

### File: `apps/admin-panel/src/lib/supabase.ts`
### File: `apps/admin-panel/src/lib/services/api.ts`

**New Table:** `admin_feed`

**Fields:**
- `id` (string)
- `event_type` (string)
- `description` (string | null)
- `user_id` (string | null)
- `sos_event_id` (string | null)
- `severity` (string | null)
- `category` (string | null)
- `source` (string | null)
- `event_data` (any | null)
- `metadata` (any | null)
- `created_at` (string)

**New Service Method:**
- `APIService.getAdminFeed(filters?)` - fetches admin feed events with optional filtering

**Reason:** This table provides an activity feed for admin users and was missing from the codebase.

---

## 6. Type Definitions Updated

### File: `apps/admin-panel/src/types/sos.ts`

**SOSEvent Interface:**
- Added all missing fields from sos_alerts schema
- Maintained backward compatibility with legacy fields

**EmergencyContact Interface:**
- Updated to use `phone_number` as primary field
- Added `email` and `updated_at` fields
- Maintained `phone` as legacy alias

### File: `apps/admin-panel/src/types/media.ts`

**Media Interface:**
- Updated to match sos_media table schema
- Added all chunking and metadata fields
- Maintained legacy fields for backward compatibility

---

## 7. API Services Updated

### File: `apps/admin-panel/src/lib/services/api.ts`

**Changes:**
- `getEmergencyContacts()` - Added mapping for phone_number → phone
- Added `getSOSStatusHistory()` method
- Added `getAdminFeed()` method

### File: `apps/admin-panel/src/lib/services/sosDataService.ts`

**Changes:**
- Updated media filtering to check both `sos_event_id` and `sos_id` fields
- Updated to use `sos_media` table name

### File: `apps/admin-panel/src/lib/supabase.ts`

**Changes:**
- `mediaService.getMediaForSOSEvent()` - Updated to query `sos_media` table
- Updated realtime subscription to use `sos_media` table name

---

## 8. Backward Compatibility

All changes maintain backward compatibility by:
- Keeping legacy field names as optional aliases
- Mapping new field names to old ones where needed
- Not removing any existing fields, only adding new ones

---

## Files Modified

1. `apps/admin-panel/src/lib/supabase.ts` - Database type definitions
2. `apps/admin-panel/src/types/sos.ts` - SOS and EmergencyContact interfaces
3. `apps/admin-panel/src/types/media.ts` - Media interface
4. `apps/admin-panel/src/lib/services/api.ts` - API service methods
5. `apps/admin-panel/src/lib/services/sosDataService.ts` - SOS data service
6. `apps/admin-panel/src/components/admin/TestMode.tsx` - Updated to use sos_media table
7. `apps/admin-panel/src/components/media/MediaUpload.tsx` - Updated to use sos_media table with correct fields
8. `SCHEMA_SYNC_CHANGES.md` - This documentation file

---

## Next Steps

1. ✅ Database types synchronized
2. ✅ API services updated
3. ⏳ UI components may need updates to display new fields (optional)
4. ⏳ Add UI pages for sos_status_history and admin_feed (optional)

---

## Notes

- The `spatial_ref_sys` table is a PostGIS system table and does not need to be included in the admin panel
- All changes are backward compatible
- No data migration required - only type definitions and API updates

