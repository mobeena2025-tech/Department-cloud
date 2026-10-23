import supabase from './supabase.js';

const { data, error } = await supabase
  .from('test_connection')
  .select('*');

console.log('Data:', data);
console.log('Error:', error);