import { pipeline, PipelineType } from '@huggingface/transformers';

// Singleton Class to ensure we only load the model ONCE.
class PipelineFactory {
  static task: PipelineType = 'feature-extraction';
  static model = 'Xenova/all-MiniLM-L6-v2';
  static instance: any = null;

  static async getInstance() {
    if (this.instance === null) {
      console.log("Loading Edge AI Model... (This happens only once)");
      // Download the model from Hugging Face Hub
      this.instance = await pipeline(this.task, this.model);
    }
    return this.instance;
  }
}

export async function generateEmbedding(text: string): Promise<number[]> {
  try {
    const extractor = await PipelineFactory.getInstance();
    
    // Generate the vector
    const output = await extractor(text, { 
      pooling: 'mean', 
      normalize: true 
    });

    // The output is a Tensor. We need the raw array.
    // output.data is a Float32Array, we convert it to a normal number[]
    return Array.from(output.data);

  } catch (error) {
    console.error("Error generating embedding:", error);
    throw new Error("Failed to generate vector embedding.");
  }
}