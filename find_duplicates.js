
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function findDuplicateEmails() {
  console.log("Searching for duplicate emails in profiles table...");
  const { data, error } = await supabase
    .from('profiles')
    .select('id, email, full_name, plan');

  if (error) {
    console.error("Error fetching profiles:", error);
    return;
  }

  const emailMap = {};
  const duplicates = [];

  data.forEach(p => {
    if (!p.email) return;
    const email = p.email.toLowerCase();
    if (emailMap[email]) {
      duplicates.push({ email, users: [emailMap[email], p] });
    } else {
      emailMap[email] = p;
    }
  });

  if (duplicates.length === 0) {
    console.log("No duplicate emails found in the current profiles table.");
    // Let's also print all emails to see if there's any confusion
    console.log("Total profiles:", data.length);
    data.forEach(p => console.log(`- ID: ${p.id}, Email: ${p.email}, Plan: ${p.plan}`));
  } else {
    console.log("Found duplicates:");
    duplicates.forEach(d => {
      console.log(`Email: ${d.email}`);
      d.users.forEach(u => console.log(`  -> ID: ${u.id}, Name: ${u.full_name}, Plan: ${u.plan}`));
    });
  }
}

findDuplicateEmails();
