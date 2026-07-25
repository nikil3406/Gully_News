let hasPostgis = null;
let hasLocationColumns = null;

export const checkPostgis = async (pool) => {
  if (hasPostgis !== null) return hasPostgis;
  try {
    const res = await pool.query("SELECT EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'postgis') AS has_postgis;");
    hasPostgis = res.rows[0].has_postgis;
  } catch (err) {
    hasPostgis = false;
  }
  return hasPostgis;
};

export const checkLocationColumns = async (pool) => {
  if (hasLocationColumns !== null) return hasLocationColumns;

  try {
    const res = await pool.query(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'posts'
    `);

    const columns = new Set(res.rows.map(row => row.column_name.toLowerCase()));
    hasLocationColumns = {
      latitude: columns.has('latitude'),
      longitude: columns.has('longitude'),
      city: columns.has('city'),
      state: columns.has('state'),
      country: columns.has('country'),
      location_geom: columns.has('location_geom'),
      location_id: columns.has('location_id')
    };
  } catch (err) {
    hasLocationColumns = {
      latitude: false,
      longitude: false,
      city: false,
      state: false,
      country: false,
      location_geom: false,
      location_id: false
    };
  }

  return hasLocationColumns;
};
