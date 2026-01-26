
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Manually load .env.local
try {
    const envConfig = fs.readFileSync(path.resolve(__dirname, '.env.local'), 'utf-8');
    envConfig.split(/\r?\n/).forEach(line => {
        const [key, val] = line.split('=');
        if (key && val) {
            process.env[key.trim()] = val.trim().replace(/^["']|["']$/g, ''); // Remove quotes
        }
    });
} catch (e) {
    console.error('Error loading .env.local', e);
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing env vars');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkOrderData() {
    console.log('Logging in...');
    const { data: { user }, error: loginError } = await supabase.auth.signInWithPassword({
        email: 'nurullahkurnaz47@gmail.com',
        password: 'Nurullah@47'
    });

    if (loginError) {
        console.error('Login failed:', loginError);
        return;
    }

    console.log('Logged in as:', user.id);
    const orderId = 'NPC-1769420355675-433'; // The problematic order
    console.log('\nChecking Order:', orderId);

    // 1. Check Order
    const { data: order, error: orderError } = await supabase
        .from('orders')
        .select(`
            id, 
            status, 
            product_id, 
            shopier_order_id,
            user_id,
            products(slug)
        `)
        .eq('shopier_order_id', orderId) // Try shopier ID field
        .maybeSingle();

    if (orderError) {
        console.error('Order Error:', orderError);
        return;
    }

    if (!order) {
        console.log('Order NOT FOUND by shopier_order_id. Trying id...');
        // Try ID? But it starts with NPC... it IS shopier id.
        return;
    }

    console.log('Order Found:', order);

    console.log(`\nChecking Accounts for User: ${user.id} and Product: ${order.product_id}...`);

    // 2. Check User Product Accounts
    const { data: accounts, error: accountsError } = await supabase
        .from('user_product_accounts')
        .select('*')
        .eq('user_id', user.id)
        .eq('product_id', order.product_id);

    if (accountsError) console.error('Accounts Error:', accountsError);
    else {
        console.log('Accounts Found:', accounts.length);
        if (accounts.length > 0) {
            console.table(accounts);
        } else {
            console.log('NO ACCOUNTS FOUND. This is why it redirects to setup.');

            // Debug: Check if ANY accounts exist for this user?
            const { data: allAccounts } = await supabase.from('user_product_accounts').select('*').eq('user_id', user.id);
            console.log('\nAll Accounts for User:', allAccounts?.length);
            console.table(allAccounts);
        }
    }
}

checkOrderData();
