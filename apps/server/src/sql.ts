// Convert syntax outside quoted SQL text only. All user values remain driver parameters.
export function postgresSQL(sql: string): string {
  let index = 0;
  return sql.replace(/'(?:''|[^'])*'|"(?:""|[^"])*"|\?|[A-Za-z_][A-Za-z_0-9]*/g, (token) => {
    if (token === '?') return '$' + ++index;
    if (token.startsWith("'") || token.startsWith('"')) return token;
    if (token.toLowerCase() === 'instr') return 'strpos';
    if (token === 'INTEGER') return 'BIGINT';
    return /[a-z][A-Z]/.test(token) ? '"' + token + '"' : token;
  });
}
