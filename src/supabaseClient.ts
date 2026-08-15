import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://oejvnpkvftkfccofvkqx.supabase.co'
const supabaseAnonKey = 'sb_publishable_46uZUEYFGgrzXtEnhu-5Mw_t8VkZ0T5'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)