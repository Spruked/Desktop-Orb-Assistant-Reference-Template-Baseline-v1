// Launches the FastAPI governance server as a child process
import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export function startGovernanceAPI() {
  const apiPath = path.join(__dirname, '../../../domain/models/governance_layer/api.py');
  const venvPython = process.env.VENV_PYTHON || 'python';
  const uvicornArgs = [
    '-m', 'uvicorn', 'api:app', '--reload', '--host', '127.0.0.1', '--port', '8000'
  ];
  const proc = spawn(venvPython, uvicornArgs, {
    cwd: path.join(__dirname, '../../../domain/models/governance_layer'),
    stdio: 'inherit',
    shell: true
  });
  return proc;
}
