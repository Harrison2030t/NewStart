import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://fmjraryzqjtithiljkez.supabase.co';
const supabaseKey = 'sb_publishable_vgh26GyS_To0CYC7ZuIwsg_7FMhCtgU';

export const supabase = createClient(supabaseUrl, supabaseKey);
