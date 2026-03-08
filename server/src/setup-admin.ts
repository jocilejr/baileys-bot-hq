import "dotenv/config";
import { createClient } from "@supabase/supabase-js";
import * as readline from "readline";

async function main() {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error("❌ SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY são obrigatórios no .env");
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  // Support non-interactive mode via env vars
  let email = process.env.ADMIN_EMAIL || "";
  let password = process.env.ADMIN_PASSWORD || "";

  if (!email || !password) {
    // Interactive mode (fallback)
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    const ask = (q: string): Promise<string> => new Promise((r) => rl.question(q, r));

    console.log("\n🔐 Criação do Administrador\n");

    email = await ask("Email do admin: ");
    password = await ask("Senha do admin (min 6 chars): ");
    rl.close();
  }

  if (!email || password.length < 6) {
    console.error("❌ Email e senha (min 6 chars) são obrigatórios");
    process.exit(1);
  }

  console.log(`🔐 Criando admin: ${email}`);

  // Create user via Supabase Auth Admin API
  const { data: userData, error: userError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });

  if (userError) {
    console.error("❌ Erro ao criar usuário:", userError.message);
    process.exit(1);
  }

  console.log(`✅ Usuário criado: ${userData.user.id}`);

  // Assign admin role
  const { error: roleError } = await supabase.from("user_roles").insert({
    user_id: userData.user.id,
    role: "admin",
  });

  if (roleError) {
    console.error("❌ Erro ao atribuir role:", roleError.message);
    process.exit(1);
  }

  console.log("✅ Role 'admin' atribuída com sucesso");
  console.log(`\n🎉 Admin criado! Acesse com: ${email}\n`);
}

main();
