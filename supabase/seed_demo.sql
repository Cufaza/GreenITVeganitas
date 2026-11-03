-- Carga la empresa de demostración en la cuenta con el email indicado.
-- Antes: crear el usuario en Supabase (Authentication > Users > Add user, con "Auto Confirm User"),
-- por ejemplo demo@greenitcalc.com. El trigger crea su organización automáticamente.
-- Se ejecuta desde el SQL Editor (corre como postgres).
do $$
declare
  v_email text := 'demo@greenitcalc.com';  -- <-- cambiar si usás otro email
  v_org uuid;
begin
  select org_id into v_org from public.profiles where email = v_email;
  if v_org is null then
    raise exception 'No existe un usuario con el email % (creálo primero en Authentication)', v_email;
  end if;
  perform public._insertar_demo(v_org);
end $$;
