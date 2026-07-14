import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://uafgsudptqlmyytfrybl.supabase.co'
const supabaseAnonKey = 'sb_publishable_GCjq6VvxQxM0Ms0NNkJBKA_FiT__4Vy'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
