import subprocess
import os

def runTest(i):
  proc = subprocess.Popen(
    ['node', 'lib/integrationTests/run.js'],
    stdout=subprocess.PIPE,
    stderr=subprocess.PIPE,
    env=dict(os.environ, **{'DEBUG':'waggle*,nectar:test*'})
  )

  proc.wait()
  print(f'Finished with {i} command')
  stdout, stderr = proc.communicate()

  print(f'Test {i} exited with {proc.returncode}]')
  if proc.returncode == 1:
    info = ''
    if stdout:
      info += stdout.decode()
    if stderr:
      info += '\n - - - - \n' + stderr.decode()
    
    with open('resultsSync.txt', 'a') as f:
      f.write(info)

    return info
  return None

def run():
  results = []
  testsCount = 20
  for i in range(testsCount):
    results.append(runTest(i))

  failed = results.filter(lambda n: n is not None, results)
  print(len(failed), 'tests failed')
  with open('resultsSync.txt', 'a') as f:
    f.write(f'TEST RAN {testsCount} TIMES. FAILED: {len(failed)}\n')

run()