import os
import asyncio
failed = []
results = []

async def runTest(cmd):
  print('running test')
  proc = await asyncio.create_subprocess_shell(
      cmd,
      stdout=asyncio.subprocess.PIPE,
      stderr=asyncio.subprocess.PIPE,
      env=dict(os.environ, **{'DEBUG':'waggle*,nectar:test*'}))

  stdout, stderr = await proc.communicate()

  print(f'[{cmd!r} exited with {proc.returncode}]')
  # if proc.returncode == 1:
  info = '\n v v v v v \n'
  if stdout:
    info += stdout.decode()
  info += '\n\n'
  if stderr:
    info += stderr.decode()
  info += '\n ^ ^ ^ ^ ^ \n'
  results.append(info)
  if proc.returncode == 1:
    failed.append(info)

async def runTests():
  tasks = []
  testsCount = 20
  for i in range(testsCount):
    print(f'creating task {i}')
    tasks.append(asyncio.create_task(runTest("node lib/integrationTests/run.js")))
  await asyncio.gather(*tasks)
  print('failed:', len(failed))
  with open('results.txt', 'w') as f:
    f.write(f'TEST RAN {testsCount} TIMES. FAILED: {len(failed)}\n')
    f.writelines(results)


asyncio.run(runTests())