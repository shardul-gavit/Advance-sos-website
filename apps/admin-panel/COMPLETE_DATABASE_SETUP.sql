-- Complete Database Setup for Advance SOS System Admin Panel
-- This script creates all necessary tables, indexes, and policies

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create custom types
CREATE TYPE emergency_type AS ENUM ('medical', 'fire', 'police', 'other');
CREATE TYPE sos_status AS ENUM ('active', 'assigned', 'resolved', 'cancelled');
CREATE TYPE helper_status AS ENUM ('available', 'busy', 'offline');
CREATE TYPE media_type AS ENUM ('image', 'video', 'audio');

-- Create users table (extends Supabase auth)
CREATE TABLE IF NOT EXISTS public.users (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    phone TEXT,
    emergency_contacts JSONB DEFAULT '[]',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create FCM tokens table
CREATE TABLE IF NOT EXISTS public.fcm_tokens (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    token TEXT UNIQUE NOT NULL,
    device_type TEXT DEFAULT 'web',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create SOS events table
CREATE TABLE IF NOT EXISTS public.sos_events (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    emergency_type emergency_type NOT NULL,
    description TEXT,
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    address TEXT,
    priority sos_status DEFAULT 'medium',
    status sos_status DEFAULT 'active',
    assigned_helper_id UUID,
    assigned_responder_id UUID,
    is_test BOOLEAN DEFAULT false,
    resolved_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create helpers table
CREATE TABLE IF NOT EXISTS public.helpers (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    phone TEXT NOT NULL,
    organization TEXT,
    skills TEXT[] DEFAULT '{}',
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    status helper_status DEFAULT 'offline',
    emergency_types emergency_type[] DEFAULT '{}',
    is_verified BOOLEAN DEFAULT false,
    is_test BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create responders table
CREATE TABLE IF NOT EXISTS public.responders (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    phone TEXT NOT NULL,
    organization TEXT NOT NULL,
    department TEXT NOT NULL,
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    status helper_status DEFAULT 'offline',
    emergency_types emergency_type[] DEFAULT '{}',
    is_verified BOOLEAN DEFAULT false,
    is_test BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create hospitals table
CREATE TABLE IF NOT EXISTS public.hospitals (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    phone TEXT NOT NULL,
    address TEXT NOT NULL,
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    emergency_services TEXT[] DEFAULT '{}',
    is_24_hours BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create media table
CREATE TABLE IF NOT EXISTS public.media (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    sos_event_id UUID REFERENCES public.sos_events(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    file_name TEXT NOT NULL,
    file_url TEXT NOT NULL,
    file_type media_type NOT NULL,
    file_size BIGINT NOT NULL,
    duration INTEGER,
    is_test BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create locations table
CREATE TABLE IF NOT EXISTS public.locations (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    address TEXT,
    is_favorite BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create admin users table
CREATE TABLE IF NOT EXISTS public.admins (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    role TEXT DEFAULT 'admin',
    organization TEXT,
    phone TEXT,
    permissions JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    last_login TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create audit log table
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    admin_id UUID REFERENCES public.admins(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    table_name TEXT,
    record_id UUID,
    old_values JSONB,
    new_values JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_sos_events_user_id ON public.sos_events(user_id);
CREATE INDEX IF NOT EXISTS idx_sos_events_status ON public.sos_events(status);
CREATE INDEX IF NOT EXISTS idx_sos_events_created_at ON public.sos_events(created_at);
CREATE INDEX IF NOT EXISTS idx_sos_events_location ON public.sos_events USING GIST (ll_to_earth(latitude, longitude));
CREATE INDEX IF NOT EXISTS idx_sos_events_is_test ON public.sos_events(is_test);

CREATE INDEX IF NOT EXISTS idx_helpers_user_id ON public.helpers(user_id);
CREATE INDEX IF NOT EXISTS idx_helpers_status ON public.helpers(status);
CREATE INDEX IF NOT EXISTS idx_helpers_location ON public.helpers USING GIST (ll_to_earth(latitude, longitude));

CREATE INDEX IF NOT EXISTS idx_responders_user_id ON public.responders(user_id);
CREATE INDEX IF NOT EXISTS idx_responders_status ON public.responders(status);
CREATE INDEX IF NOT EXISTS idx_responders_location ON public.responders USING GIST (ll_to_earth(latitude, longitude));

CREATE INDEX IF NOT EXISTS idx_hospitals_location ON public.hospitals USING GIST (ll_to_earth(latitude, longitude));

CREATE INDEX IF NOT EXISTS idx_media_sos_event_id ON public.media(sos_event_id);
CREATE INDEX IF NOT EXISTS idx_media_user_id ON public.media(user_id);
CREATE INDEX IF NOT EXISTS idx_media_is_test ON public.media(is_test);

CREATE INDEX IF NOT EXISTS idx_fcm_tokens_user_id ON public.fcm_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_fcm_tokens_token ON public.fcm_tokens(token);
CREATE INDEX IF NOT EXISTS idx_fcm_tokens_is_active ON public.fcm_tokens(is_active);

CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON public.audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.audit_logs(created_at);

-- Create functions for distance calculations
CREATE OR REPLACE FUNCTION calculate_distance(lat1 DOUBLE PRECISION, lon1 DOUBLE PRECISION, lat2 DOUBLE PRECISION, lon2 DOUBLE PRECISION)
RETURNS DOUBLE PRECISION AS $$
BEGIN
    RETURN 6371000 * acos(
        cos(radians(lat1)) * cos(radians(lat2)) * cos(radians(lon2) - radians(lon1)) +
        sin(radians(lat1)) * sin(radians(lat2))
    );
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_sos_events_updated_at BEFORE UPDATE ON public.sos_events FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_helpers_updated_at BEFORE UPDATE ON public.helpers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_responders_updated_at BEFORE UPDATE ON public.responders FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_hospitals_updated_at BEFORE UPDATE ON public.hospitals FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_admins_updated_at BEFORE UPDATE ON public.admins FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_fcm_tokens_updated_at BEFORE UPDATE ON public.fcm_tokens FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fcm_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sos_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.helpers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.responders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hospitals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.media ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Create RLS policies

-- Users policies
CREATE POLICY "Users can view their own profile" ON public.users
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON public.users
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Admins can view all users" ON public.users
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.admins 
            WHERE id = auth.uid() AND is_active = true
        )
    );

-- FCM tokens policies
CREATE POLICY "Users can manage their own FCM tokens" ON public.fcm_tokens
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all FCM tokens" ON public.fcm_tokens
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.admins 
            WHERE id = auth.uid() AND is_active = true
        )
    );

-- SOS events policies
CREATE POLICY "Users can view their own SOS events" ON public.sos_events
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create SOS events" ON public.sos_events
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own SOS events" ON public.sos_events
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all SOS events" ON public.sos_events
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.admins 
            WHERE id = auth.uid() AND is_active = true
        )
    );

CREATE POLICY "Admins can manage all SOS events" ON public.sos_events
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.admins 
            WHERE id = auth.uid() AND is_active = true
        )
    );

-- Helpers policies
CREATE POLICY "Users can view helpers" ON public.helpers
    FOR SELECT USING (true);

CREATE POLICY "Users can create helper profiles" ON public.helpers
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own helper profile" ON public.helpers
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all helpers" ON public.helpers
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.admins 
            WHERE id = auth.uid() AND is_active = true
        )
    );

-- Responders policies
CREATE POLICY "Users can view responders" ON public.responders
    FOR SELECT USING (true);

CREATE POLICY "Users can create responder profiles" ON public.responders
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own responder profile" ON public.responders
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all responders" ON public.responders
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.admins 
            WHERE id = auth.uid() AND is_active = true
        )
    );

-- Hospitals policies (public read, admin write)
CREATE POLICY "Anyone can view hospitals" ON public.hospitals
    FOR SELECT USING (true);

CREATE POLICY "Admins can manage hospitals" ON public.hospitals
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.admins 
            WHERE id = auth.uid() AND is_active = true
        )
    );

-- Media policies
CREATE POLICY "Users can view media from their SOS events" ON public.media
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.sos_events 
            WHERE id = sos_event_id AND user_id = auth.uid()
        )
    );

CREATE POLICY "Users can upload media to their SOS events" ON public.media
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.sos_events 
            WHERE id = sos_event_id AND user_id = auth.uid()
        )
    );

CREATE POLICY "Admins can view all media" ON public.media
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.admins 
            WHERE id = auth.uid() AND is_active = true
        )
    );

CREATE POLICY "Admins can manage all media" ON public.media
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.admins 
            WHERE id = auth.uid() AND is_active = true
        )
    );

-- Locations policies
CREATE POLICY "Users can view their own locations" ON public.locations
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own locations" ON public.locations
    FOR ALL USING (auth.uid() = user_id);

-- Admins policies
CREATE POLICY "Admins can view admin profiles" ON public.admins
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Admins can update their own profile" ON public.admins
    FOR UPDATE USING (auth.uid() = id);

-- Audit logs policies
CREATE POLICY "Admins can view audit logs" ON public.audit_logs
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.admins 
            WHERE id = auth.uid() AND is_active = true
        )
    );

-- Create storage buckets and policies
INSERT INTO storage.buckets (id, name, public) VALUES 
    ('media-images', 'media-images', true),
    ('media-videos', 'media-videos', true),
    ('media-audio', 'media-audio', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies
CREATE POLICY "Public read access for media" ON storage.objects
    FOR SELECT USING (bucket_id IN ('media-images', 'media-videos', 'media-audio'));

CREATE POLICY "Authenticated users can upload media" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id IN ('media-images', 'media-videos', 'media-audio') 
        AND auth.role() = 'authenticated'
    );

CREATE POLICY "Users can update their own media" ON storage.objects
    FOR UPDATE USING (
        bucket_id IN ('media-images', 'media-videos', 'media-audio') 
        AND auth.uid()::text = (storage.foldername(name))[1]
    );

CREATE POLICY "Admins can delete any media" ON storage.objects
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM public.admins 
            WHERE id = auth.uid() AND is_active = true
        )
    );

-- Insert sample data
INSERT INTO public.hospitals (name, phone, address, latitude, longitude, emergency_services, is_24_hours) VALUES
    ('SSG Hospital', '+91-265-2424848', 'SSG Hospital Road, Vadodara, Gujarat', 22.3072, 73.1812, ARRAY['Emergency', 'Trauma', 'ICU'], true),
    ('Sayaji General Hospital', '+91-265-2433333', 'Sayaji Road, Vadodara, Gujarat', 22.3150, 73.1750, ARRAY['Emergency', 'Cardiology', 'Neurology'], true),
    ('Gotri Medical Center', '+91-265-2444444', 'Gotri Road, Vadodara, Gujarat', 22.3200, 73.1700, ARRAY['Emergency', 'Pediatrics'], false)
ON CONFLICT DO NOTHING;

-- Create admin user (replace with actual admin credentials)
INSERT INTO public.admins (id, email, name, role, organization, is_active) VALUES
    (uuid_generate_v4(), 'admin@advancesos.in', 'System Admin', 'admin', 'Advance SOS System', true)
ON CONFLICT (email) DO NOTHING;

-- Enable real-time for all tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.sos_events;
ALTER PUBLICATION supabase_realtime ADD TABLE public.helpers;
ALTER PUBLICATION supabase_realtime ADD TABLE public.responders;
ALTER PUBLICATION supabase_realtime ADD TABLE public.hospitals;
ALTER PUBLICATION supabase_realtime ADD TABLE public.media;
ALTER PUBLICATION supabase_realtime ADD TABLE public.locations;
ALTER PUBLICATION supabase_realtime ADD TABLE public.fcm_tokens;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated;

-- Create function to log admin actions
CREATE OR REPLACE FUNCTION log_admin_action(action_name TEXT, action_data JSONB DEFAULT '{}')
RETURNS VOID AS $$
BEGIN
    INSERT INTO public.audit_logs (admin_id, action, new_values)
    VALUES (auth.uid(), action_name, action_data);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission on the function
GRANT EXECUTE ON FUNCTION log_admin_action(TEXT, JSONB) TO authenticated; 