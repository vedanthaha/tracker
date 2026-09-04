
const fs = require('fs');
const content = fs.readFileSync('utils/supabase/info.tsx', 'utf8');
const projectId = content.match(/projectId = "([^"]+)"/)[1];
const publicAnonKey = content.match(/publicAnonKey = "([^"]+)"/)[1];
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient('https://' + projectId + '.supabase.co', publicAnonKey);
supabase.from('metric_activities').select('id').limit(1).then(res => console.log('Activities:', res.error ? res.error : res.data));

