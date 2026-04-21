const ADODB = require("node-adodb");

const connection = ADODB.open(
  "Provider=Microsoft.ACE.OLEDB.12.0;Data Source=C:\\data\\Sgiw14.mdb;"
);

async function test() {
  try {
    const data = await connection.query("SELECT TOP 5 * FROM CLIENTES");
    console.log("✅ FUNCIONA");
    console.log(data);
  } catch (err) {
    console.error("❌ ERROR");
    console.error(err);
  }
}

test();