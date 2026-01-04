/**
 * Harvester Service - Triggers Python harvester scripts
 */

const { spawn } = require('child_process');
const path = require('path');

/**
 * Trigger a harvester for a specific source
 * @param {string} source - Source name ('coursera' or 'udacity')
 * @returns {Promise<Object>} Promise that resolves with harvester result
 */
function triggerHarvester(source) {
  return new Promise((resolve, reject) => {
    const validSources = ['coursera', 'udacity'];
    
    if (!validSources.includes(source.toLowerCase())) {
      return reject(new Error(`Invalid source. Valid sources: ${validSources.join(', ')}`));
    }

    // Path to Python harvester script
    const projectRoot = path.resolve(__dirname, '../..');
    const harvesterPath = path.join(projectRoot, 'harvesters', `${source}_harvester.py`);

    console.log(`Triggering harvester for source: ${source}`);
    console.log(`Script path: ${harvesterPath}`);

    // Spawn Python process
    const pythonProcess = spawn('python', [harvesterPath], {
      cwd: projectRoot,
      stdio: ['pipe', 'pipe', 'pipe']
    });

    let stdout = '';
    let stderr = '';

    pythonProcess.stdout.on('data', (data) => {
      const output = data.toString();
      stdout += output;
      console.log(`[Harvester] ${output.trim()}`);
    });

    pythonProcess.stderr.on('data', (data) => {
      const output = data.toString();
      stderr += output;
      console.error(`[Harvester Error] ${output.trim()}`);
    });

    pythonProcess.on('close', (code) => {
      if (code === 0) {
        resolve({
          success: true,
          source,
          message: `Harvester completed successfully for ${source}`,
          output: stdout,
          exitCode: code
        });
      } else {
        reject({
          success: false,
          source,
          error: `Harvester failed with exit code ${code}`,
          stderr,
          stdout,
          exitCode: code
        });
      }
    });

    pythonProcess.on('error', (error) => {
      reject({
        success: false,
        source,
        error: `Failed to start harvester process: ${error.message}`,
        details: error
      });
    });
  });
}

/**
 * Trigger all harvesters
 * @returns {Promise<Object>} Promise that resolves with all results
 */
async function triggerAllHarvesters() {
  const sources = ['coursera', 'udacity'];
  const results = {};

  for (const source of sources) {
    try {
      results[source] = await triggerHarvester(source);
    } catch (error) {
      results[source] = error;
    }
  }

  return results;
}

module.exports = {
  triggerHarvester,
  triggerAllHarvesters
};

