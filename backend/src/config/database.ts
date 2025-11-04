import { createClient, SupabaseClient } from '@supabase/supabase-js';
import logger from '../utils/logger';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase environment variables');
}

const supabase: SupabaseClient = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

// Test connection
(async () => {
  try {
    await supabase
      .from('students')
      .select('count')
      .limit(1);
    logger.info('Supabase connection established');
  } catch (err) {
    logger.error('Supabase connection error:', err);
  }
})();

export default supabase;

