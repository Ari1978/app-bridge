import odbc from "odbc";

async function test() {
  try {

    console.log("📂 DB PATH:", process.env.ACCESS_DB_PATH);
    
    const connection = await odbc.connect(
      "Driver={Microsoft Access Driver (*.mdb, *.accdb)};DBQ=C:\\Users\\Ariel\\Desktop\\Sgiw14.mdb;"
    );

    console.log("✅ CONECTADO A ACCESS");

    // ======================
    // TABLAS
    // ======================
    const tables = await connection.tables(null, null, null, "TABLE");

    console.log("📦 TABLAS EN ACCESS:");
    console.table(tables);

    // ======================
    // DATA
    // ======================
    const clientes = await connection.query(`SELECT TOP 5 * FROM CLIENTES`);
    console.log("👤 CLIENTES:");
    console.table(clientes);

    const fc = await connection.query(`SELECT TOP 1 * FROM FC`);
    console.log("📄 FC:");
    console.table(fc);

    const fcit = await connection.query(`SELECT TOP 5 * FROM FCIT`);
    console.log("🧾 FCIT:");
    console.table(fcit);

    // ======================
    // 🔥 TEST INSERT REAL
    // ======================
    console.log("🔥 TEST INSERT FC...");

    await connection.query(`
      INSERT INTO FC (
        SISTEMA,
        CLIENTE,
        CODMOV,
        OPERACION,
        FECHADEALTA,
        FECHAFACTURA
      ) VALUES (
        'AP',
        '0001002',
        'FE',
        '01',
        #04/14/2026#,
        #04/14/2026#
      )
    `);

    console.log("✅ INSERT FC OK");

    await connection.close();
  } catch (error: any) {
    console.error("❌ ERROR ODBC:");
    console.error(error?.message || error);
  }
}

test();