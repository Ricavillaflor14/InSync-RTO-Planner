-- InSync Supabase Database Schema
-- Run this in your Supabase SQL Editor to set up the database structure

-- Enable Row Level Security
ALTER DATABASE postgres SET "app.jwt_secret" TO 'your-jwt-secret';

-- Create user roles enum
CREATE TYPE user_role AS ENUM ('Member', 'Manager', 'Admin');

-- Create profiles table to extend auth.users
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    role user_role NOT NULL DEFAULT 'Member',
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    department VARCHAR(100),
    employee_id VARCHAR(50),
    team_name VARCHAR(100),
    manager_id UUID REFERENCES public.profiles(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create seats table for office seat management
CREATE TABLE IF NOT EXISTS public.seats (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    seat_name VARCHAR(50) UNIQUE NOT NULL,
    floor VARCHAR(20),
    section VARCHAR(20),
    is_available BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create seat bookings table
CREATE TABLE IF NOT EXISTS public.seat_bookings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    seat_id UUID REFERENCES public.seats(id) ON DELETE CASCADE,
    booking_date DATE NOT NULL,
    start_time TIME DEFAULT '09:00',
    end_time TIME DEFAULT '17:00',
    is_cancelled BOOLEAN DEFAULT false,
    is_blocked BOOLEAN DEFAULT false,
    blocked_by UUID REFERENCES public.profiles(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    
    -- Allow multiple bookings per user per day for different seats
    UNIQUE(user_id, seat_id, booking_date)
);

-- Create holidays table for RTO calculations
CREATE TABLE IF NOT EXISTS public.holidays (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    holiday_name VARCHAR(255) NOT NULL,
    holiday_date DATE NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create user leaves table
CREATE TABLE IF NOT EXISTS public.user_leaves (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    leave_date DATE NOT NULL,
    leave_type VARCHAR(50) DEFAULT 'Personal Leave',
    is_approved BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    
    -- Ensure one leave per user per day
    UNIQUE(user_id, leave_date)
);

-- Create calendar entries table for RTO tracking
CREATE TABLE IF NOT EXISTS public.calendar_entries (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    entry_date DATE NOT NULL,
    entry_type VARCHAR(20) NOT NULL CHECK (entry_type IN ('OFFICE', 'WFH', 'SL', 'WFA', 'HOLIDAY', 'WFH_SITE_ANNOUNCED', 'LEAVE', 'DIL', 'VL')),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    
    -- Ensure one entry per user per day
    UNIQUE(user_id, entry_date)
);

-- Insert default office seats (1820-10F-067 through 1820-10F-100)
INSERT INTO public.seats (seat_name, floor, section) VALUES
    ('1820-10F-067', '10F', 'Section A'),
    ('1820-10F-068', '10F', 'Section A'),
    ('1820-10F-069', '10F', 'Section A'),
    ('1820-10F-070', '10F', 'Section A'),
    ('1820-10F-071', '10F', 'Section A'),
    ('1820-10F-072', '10F', 'Section A'),
    ('1820-10F-073', '10F', 'Section A'),
    ('1820-10F-074', '10F', 'Section A'),
    ('1820-10F-075', '10F', 'Section B'),
    ('1820-10F-076', '10F', 'Section B'),
    ('1820-10F-077', '10F', 'Section B'),
    ('1820-10F-078', '10F', 'Section B'),
    ('1820-10F-079', '10F', 'Section B'),
    ('1820-10F-080', '10F', 'Section B'),
    ('1820-10F-081', '10F', 'Section B'),
    ('1820-10F-082', '10F', 'Section B'),
    ('1820-10F-083', '10F', 'Section C'),
    ('1820-10F-084', '10F', 'Section C'),
    ('1820-10F-085', '10F', 'Section C'),
    ('1820-10F-086', '10F', 'Section C'),
    ('1820-10F-087', '10F', 'Section C'),
    ('1820-10F-088', '10F', 'Section C'),
    ('1820-10F-089', '10F', 'Section C'),
    ('1820-10F-090', '10F', 'Section C'),
    ('1820-10F-091', '10F', 'Section D'),
    ('1820-10F-092', '10F', 'Section D'),
    ('1820-10F-093', '10F', 'Section D'),
    ('1820-10F-094', '10F', 'Section D'),
    ('1820-10F-095', '10F', 'Section D'),
    ('1820-10F-096', '10F', 'Section D'),
    ('1820-10F-097', '10F', 'Section D'),
    ('1820-10F-098', '10F', 'Section D'),
    ('1820-10F-099', '10F', 'Section D'),
    ('1820-10F-100', '10F', 'Section D')
ON CONFLICT (seat_name) DO NOTHING;

-- Enable Row Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.seats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.seat_bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.holidays ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_leaves ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.calendar_entries ENABLE ROW LEVEL SECURITY;

-- Create RLS Policies

-- Profiles: Users can read their own profile, Managers and Admins can read all
CREATE POLICY "Users can view own profile" ON public.profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Managers and Admins can view all profiles" ON public.profiles
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() 
            AND role IN ('Manager', 'Admin')
        )
    );

CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

-- Seats: All authenticated users can view seats
CREATE POLICY "Authenticated users can view seats" ON public.seats
    FOR SELECT TO authenticated USING (true);

-- Only Managers and Admins can modify seats
CREATE POLICY "Managers and Admins can modify seats" ON public.seats
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() 
            AND role IN ('Manager', 'Admin')
        )
    );

-- Seat Bookings: Users can view and manage their own bookings
CREATE POLICY "Users can view own bookings" ON public.seat_bookings
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own bookings" ON public.seat_bookings
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own bookings" ON public.seat_bookings
    FOR UPDATE USING (auth.uid() = user_id);

-- Managers and Admins can view all bookings
CREATE POLICY "Managers and Admins can view all bookings" ON public.seat_bookings
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() 
            AND role IN ('Manager', 'Admin')
        )
    );

-- Holidays: All authenticated users can view holidays
CREATE POLICY "Authenticated users can view holidays" ON public.holidays
    FOR SELECT TO authenticated USING (true);

-- Managers and Admins can modify holidays
CREATE POLICY "Managers and Admins can modify holidays" ON public.holidays
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() 
            AND role IN ('Manager', 'Admin')
        )
    );

-- User Leaves: Users can manage their own leaves
CREATE POLICY "Users can view own leaves" ON public.user_leaves
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own leaves" ON public.user_leaves
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own leaves" ON public.user_leaves
    FOR UPDATE USING (auth.uid() = user_id);

-- Managers and Admins can view and approve all leaves
CREATE POLICY "Managers and Admins can view all leaves" ON public.user_leaves
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() 
            AND role IN ('Manager', 'Admin')
        )
    );

CREATE POLICY "Managers and Admins can approve leaves" ON public.user_leaves
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() 
            AND role IN ('Manager', 'Admin')
        )
    );

-- Calendar Entries: Users can manage their own calendar entries
CREATE POLICY "Users can view own calendar entries" ON public.calendar_entries
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own calendar entries" ON public.calendar_entries
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own calendar entries" ON public.calendar_entries
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own calendar entries" ON public.calendar_entries
    FOR DELETE USING (auth.uid() = user_id);

-- Managers and Admins can view all calendar entries
CREATE POLICY "Managers and Admins can view all calendar entries" ON public.calendar_entries
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() 
            AND role IN ('Manager', 'Admin')
        )
    );

-- Create function to automatically create user profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
    INSERT INTO public.profiles (id, email, role)
    VALUES (
        new.id,
        new.email,
        CASE 
            -- Set first user as Admin, subsequent users as Members
            WHEN (SELECT COUNT(*) FROM public.profiles) = 0 THEN 'Admin'
            ELSE 'Member'
        END
    );
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS trigger AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add updated_at triggers to all tables
CREATE TRIGGER handle_updated_at BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER handle_updated_at BEFORE UPDATE ON public.seats
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER handle_updated_at BEFORE UPDATE ON public.seat_bookings
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER handle_updated_at BEFORE UPDATE ON public.calendar_entries
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
