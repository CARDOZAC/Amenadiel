/**
 * Script de Verificación de Configuración de Supabase
 * ===================================================
 * Este script verifica que:
 * 1. Las variables de entorno estén configuradas correctamente
 * 2. La conexión a Supabase funcione
 * 3. Las tablas principales existan
 * 4. Los usuarios de prueba estén creados
 * 5. El bucket de Storage exista
 */

const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

// Cargar variables de entorno
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

// Colores para la consola
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

const log = {
  success: (msg) => console.log(`${colors.green}✅ ${msg}${colors.reset}`),
  error: (msg) => console.log(`${colors.red}❌ ${msg}${colors.reset}`),
  warning: (msg) => console.log(`${colors.yellow}⚠️  ${msg}${colors.reset}`),
  info: (msg) => console.log(`${colors.blue}ℹ️  ${msg}${colors.reset}`),
  step: (msg) => console.log(`${colors.cyan}🔍 ${msg}${colors.reset}`),
};

async function verifySupabaseSetup() {
  console.log('\n' + '='.repeat(60));
  console.log('🚀 VERIFICACIÓN DE CONFIGURACIÓN DE SUPABASE');
  console.log('='.repeat(60) + '\n');

  let hasErrors = false;

  // 1. Verificar variables de entorno
  log.step('Verificando variables de entorno...');

  const requiredEnvVars = {
    'NEXT_PUBLIC_SUPABASE_URL': process.env.NEXT_PUBLIC_SUPABASE_URL,
    'NEXT_PUBLIC_SUPABASE_ANON_KEY': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    'SUPABASE_SERVICE_ROLE_KEY': process.env.SUPABASE_SERVICE_ROLE_KEY,
  };

  for (const [key, value] of Object.entries(requiredEnvVars)) {
    if (!value) {
      log.error(`Variable ${key} no está definida`);
      hasErrors = true;
    } else if (value.includes('TU_PROJECT_REF') || value.includes('tu_')) {
      log.error(`Variable ${key} no ha sido reemplazada con valor real`);
      hasErrors = true;
    } else {
      log.success(`Variable ${key} configurada`);
    }
  }

  if (hasErrors) {
    log.error('\nConfigura las variables de entorno en .env.local antes de continuar');
    log.info('Revisa el archivo .env.example para ver el formato correcto');
    process.exit(1);
  }

  console.log('');

  // 2. Crear cliente de Supabase
  log.step('Creando cliente de Supabase...');

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  );

  log.success('Cliente de Supabase creado');
  console.log('');

  // 3. Verificar conexión
  log.step('Verificando conexión a Supabase...');

  try {
    const { data, error } = await supabase
      .from('users')
      .select('count')
      .limit(1);

    if (error) {
      log.error(`Error al conectar: ${error.message}`);
      log.warning('Posibles causas:');
      log.warning('  - Las credenciales son incorrectas');
      log.warning('  - La tabla "users" no existe (ejecuta las migraciones)');
      log.warning('  - El proyecto de Supabase está pausado');
      hasErrors = true;
    } else {
      log.success('Conexión a Supabase exitosa');
    }
  } catch (err) {
    log.error(`Error inesperado: ${err.message}`);
    hasErrors = true;
  }

  console.log('');

  // 4. Verificar tablas
  log.step('Verificando que las tablas existan...');

  const expectedTables = [
    'users',
    'routes',
    'clients',
    'loans',
    'installments',
    'daysheets',
    'closings',
    'collection_events',
    'expense_events',
    'ledger_transactions',
  ];

  let tableCount = 0;
  for (const table of expectedTables) {
    try {
      const { data, error } = await supabase
        .from(table)
        .select('count')
        .limit(1);

      if (!error) {
        tableCount++;
      } else {
        log.error(`Tabla "${table}" no existe o no es accesible`);
      }
    } catch (err) {
      log.error(`Error al verificar tabla "${table}"`);
    }
  }

  if (tableCount === expectedTables.length) {
    log.success(`${tableCount}/${expectedTables.length} tablas detectadas`);
  } else {
    log.warning(`Solo ${tableCount}/${expectedTables.length} tablas detectadas`);
    log.info('Ejecuta las migraciones SQL en Supabase (ver SUPABASE_SETUP.md)');
  }

  console.log('');

  // 5. Verificar usuarios de prueba
  log.step('Verificando usuarios de prueba...');

  try {
    const { data: users, error } = await supabase
      .from('users')
      .select('email, role, full_name')
      .order('email');

    if (error) {
      log.error(`Error al obtener usuarios: ${error.message}`);
    } else if (users.length === 0) {
      log.warning('No hay usuarios en la tabla "users"');
      log.info('Ejecuta el seed: database/seeds/001_test_users.sql');
    } else {
      log.success(`${users.length} usuario(s) encontrado(s):`);
      users.forEach(user => {
        console.log(`   - ${user.email} (${user.role})`);
      });

      // Verificar usuarios específicos de prueba
      const testEmails = ['patron@amenadiel.com', 'contador@amenadiel.com', 'cobrador@amenadiel.com'];
      const foundEmails = users.map(u => u.email);
      const missingUsers = testEmails.filter(email => !foundEmails.includes(email));

      if (missingUsers.length > 0) {
        log.warning('Faltan usuarios de prueba:');
        missingUsers.forEach(email => console.log(`   - ${email}`));
        log.info('Créalos en Supabase Dashboard > Authentication > Users');
      } else {
        log.success('Todos los usuarios de prueba están presentes');
      }
    }
  } catch (err) {
    log.error(`Error al verificar usuarios: ${err.message}`);
  }

  console.log('');

  // 6. Verificar Storage bucket
  log.step('Verificando bucket de Storage...');

  try {
    const { data: buckets, error } = await supabase.storage.listBuckets();

    if (error) {
      log.error(`Error al listar buckets: ${error.message}`);
    } else {
      const paymentReceiptsBucket = buckets.find(b => b.name === 'payment-receipts');

      if (paymentReceiptsBucket) {
        log.success('Bucket "payment-receipts" existe');
        log.info(`  Público: ${paymentReceiptsBucket.public ? 'Sí' : 'No'}`);
      } else {
        log.warning('Bucket "payment-receipts" no existe');
        log.info('Créalo en Supabase Dashboard > Storage > New bucket');
      }
    }
  } catch (err) {
    log.error(`Error al verificar Storage: ${err.message}`);
  }

  console.log('');

  // 7. Verificar funciones SQL
  log.step('Verificando funciones SQL...');

  try {
    const { data, error } = await supabase.rpc('update_daysheet_expected_cash', {
      p_daysheet_id: '00000000-0000-0000-0000-000000000000',
      p_amount: 0
    });

    // Esperamos un error porque el daysheet no existe, pero si la función existe, eso es lo importante
    if (error && error.message.includes('does not exist')) {
      log.warning('Función "update_daysheet_expected_cash" no existe');
      log.info('Ejecuta la migración: database/migrations/002_daysheet_functions.sql');
    } else {
      log.success('Funciones SQL detectadas');
    }
  } catch (err) {
    log.warning('No se pudo verificar funciones SQL');
  }

  console.log('');

  // Resumen final
  console.log('='.repeat(60));
  if (hasErrors) {
    log.error('CONFIGURACIÓN INCOMPLETA - Revisa los errores arriba');
    log.info('Consulta SUPABASE_SETUP.md para instrucciones detalladas');
  } else {
    log.success('🎉 ¡CONFIGURACIÓN COMPLETA!');
    log.info('Ahora puedes ejecutar: npm run dev');
  }
  console.log('='.repeat(60) + '\n');
}

// Ejecutar verificación
verifySupabaseSetup().catch(err => {
  console.error('\n❌ Error fatal:', err.message);
  process.exit(1);
});
