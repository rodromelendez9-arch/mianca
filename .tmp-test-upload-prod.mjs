import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";

const env = Object.fromEntries(
  readFileSync(".env.local", "utf-8")
    .split("\n")
    .filter((l) => l.includes("=") && !l.trim().startsWith("#"))
    .map((l) => {
      const i = l.indexOf("=");
      return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^"|"$/g, "")];
    })
);

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
  email: "rodrigo+miancatest@gmail.com",
  password: "MiancaTest123!",
});
if (authError) throw authError;
console.log("Logged in as:", authData.user.id);

const fileBytes = readFileSync(
  "C:/Users/usuario/AppData/Local/Temp/claude/C--Users-usuario-Desktop-Mianca/89080f52-6159-409c-9bde-856fe0eb2d2a/scratchpad/test.png"
);
const ruta = `${authData.user.id}/test-${Date.now()}.png`;
const { error: uploadError } = await supabase.storage.from("equipos").upload(ruta, fileBytes, {
  contentType: "image/png",
});
if (uploadError) throw uploadError;
console.log("Uploaded to:", ruta);

const { data: publicUrlData } = supabase.storage.from("equipos").getPublicUrl(ruta);
console.log("Public URL:", publicUrlData.publicUrl);

const res = await fetch("https://mianca.vercel.app/api/equipos/analizar", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    Authorization: `Bearer ${authData.session.access_token}`,
  },
  body: JSON.stringify({ fotos: [publicUrlData.publicUrl] }),
});
console.log("API status:", res.status);
console.log("API body:", await res.text());
