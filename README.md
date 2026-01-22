# Fine-Tune Studio

A local web application for orchestrating OpenAI fine-tuning for supported models (gpt-3.5-turbo, gpt-4-0613, babbage-002, davinci-002, and others). Built with Next.js, TypeScript, Tailwind CSS, and Prisma with SQLite.

## Features

- **Convert Section**: Convert text, PDF, DOC, and DOCX files to JSONL format for training
- **Train Section**: Upload JSONL training files, create fine-tuning jobs, and monitor progress in real-time
- **Test Section**: Test models with prompts, compare outputs side-by-side (A/B testing), and flag bad responses
- **Iteration Workflow**: Create training drafts from flagged responses and export them to JSONL format
- **Job Management**: Track all fine-tuning jobs, their status, and resulting model IDs
- **Real-time Monitoring**: Live event streaming and status updates for active jobs

## Prerequisites

- Node.js 18+ and npm
- OpenAI API key with access to fine-tuning APIs

## Setup

1. **Clone or navigate to the project directory:**
   ```bash
   cd fine-tune-studio
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up environment variables:**
   ```bash
   cp .env.example .env
   ```
   
   Then edit `.env` and add your OpenAI API key:
   ```
   DATABASE_URL="file:./dev.db"
   OPENAI_API_KEY=your_openai_api_key_here
   ```

4. **Set up the database:**
   ```bash
   npm run prisma:generate
   npm run prisma:migrate
   ```

5. **Start the development server:**
   ```bash
   npm run dev
   ```

6. **Open your browser:**
   Navigate to [http://localhost:3000](http://localhost:3000)

## Usage

### Converting Files to JSONL

1. Go to the **Convert** page (`/convert`)
2. Upload one or more files:
   - **Text files** (`.txt`, `.text`) - Direct text extraction
   - **PDF files** (`.pdf`) - Extracts text content
   - **Word documents** (`.docx`) - Extracts text from DOCX format
   - **Note**: Older `.doc` files are not fully supported; convert to DOCX or PDF first
3. Configure conversion settings:
   - **Conversion Format**: Choose how to structure training examples
     - **Knowledge Base**: Content becomes assistant responses
     - **Q&A**: Extracts questions and answers from content
     - **Content Only**: Content as user messages
   - **System Instructions** (optional): Add system messages to all examples
   - **Chunk Size**: Split large documents (default: 1000 characters)
   - **Chunk Overlap**: Overlap between chunks for context (default: 200 characters)
4. Click "Convert to JSONL"
5. Preview the generated JSONL file
6. Download the file and use it in the Train page

**Tips:**
- Large documents are automatically split into chunks for better training
- The converter ensures minimum 10 lines (adds placeholders if needed)
- Preview shows the first 10 lines before downloading
- Generated JSONL files are ready for fine-tuning

### Training Models

1. Go to the **Train** page (`/train`)
2. Select a base model that supports fine-tuning:
   - **gpt-3.5-turbo** (recommended)
   - **gpt-3.5-turbo-1106**
   - **gpt-3.5-turbo-0613**
   - **gpt-4-0613** (if available for your account)
   - **babbage-002**
   - **davinci-002**
   
   **Note**: Not all models support fine-tuning. gpt-4o-mini and gpt-4o are not currently available for fine-tuning.
3. Upload a training file in JSONL format:
   - Each line must be valid JSON
   - Each line must contain a `messages` array
   - Minimum 10 lines required
   - Messages must have `role` (system/user/assistant) and `content` fields
4. Optionally upload a validation file (same format)
5. Click "Start Training" to create a fine-tuning job
6. Monitor the job status and events in real-time
7. Once complete, the fine-tuned model ID will be displayed

### Testing Models

1. Go to the **Test** page (`/test`)
2. Select a model (base models or any fine-tuned models)
3. Optionally enter system instructions
4. Enter your prompt and click "Send"
5. View the model's response

#### A/B Comparison

1. Enable "A/B Compare Mode"
2. Select two models to compare
3. Enter a prompt and click "Send"
4. Compare outputs side-by-side
5. Select a winner and add notes (optional)
6. Save the comparison

#### Creating Training Drafts

1. After testing, if a response is unsatisfactory, click "Flag as Bad"
2. Enter the ideal answer for that prompt
3. The draft will be saved for later export

### Exporting Training Drafts

1. Go to the **Train** page
2. In the "Export Training Drafts" section, optionally customize system instructions
3. Click "Export Drafts to JSONL"
4. The file will be downloaded with all your training drafts in the correct format

## Project Structure

```
fine-tune-studio/
├── app/
│   ├── api/              # API routes
│   │   ├── convert/      # File conversion to JSONL
│   │   ├── files/        # File upload
│   │   ├── fine-tune/    # Fine-tuning operations
│   │   ├── test/         # Testing endpoints
│   │   ├── training-drafts/  # Draft management
│   │   └── models/       # Model listing
│   ├── convert/          # Convert files page
│   ├── train/            # Training page
│   ├── test/             # Testing page
│   └── layout.tsx        # Root layout
├── lib/
│   ├── prisma.ts         # Prisma client
│   ├── openai.ts         # OpenAI client
│   ├── jsonl-validator.ts        # Server-side validator
│   └── jsonl-validator.client.ts # Client-side validator
├── prisma/
│   └── schema.prisma     # Database schema
└── package.json
```

## API Routes

### File Conversion
- `POST /api/convert/to-jsonl` - Convert text, PDF, DOC, DOCX files to JSONL format

### File Upload
- `POST /api/files/upload` - Upload JSONL file to OpenAI

### Fine-Tuning
- `POST /api/fine-tune/create` - Create a fine-tuning job
- `GET /api/fine-tune/jobs` - List all jobs
- `GET /api/fine-tune/:jobId` - Get job status
- `GET /api/fine-tune/:jobId/events` - Get job events

### Testing
- `POST /api/test/respond` - Get model response
- `POST /api/test/ab` - Run A/B comparison
- `PATCH /api/test/ab/:id` - Update A/B run with winner

### Training Drafts
- `GET /api/training-drafts` - List all drafts
- `POST /api/training-drafts` - Create a draft
- `POST /api/training-drafts/export` - Export drafts as JSONL

### Models
- `GET /api/models` - List available models

## Database Models

- **FineTuneFile**: Stores uploaded file metadata
- **FineTuneJob**: Tracks fine-tuning jobs and their status
- **TestRun**: Stores individual test runs
- **ABRun**: Stores A/B comparison results
- **TrainingDraft**: Stores training examples created from flagged responses

## Security

⚠️ **Important**: The OpenAI API key is **NEVER** exposed to the browser. All OpenAI API calls are made server-side only, reading the key from environment variables.

## Troubleshooting

### Database Issues
If you encounter database errors, try:
```bash
npm run prisma:generate
npm run prisma:migrate
```

### API Key Issues
Make sure your `.env` file contains a valid `OPENAI_API_KEY` and that it has the necessary permissions for fine-tuning.

### File Upload Issues
- Ensure files are valid JSONL format
- Check that files have at least 10 lines
- Verify each line has a `messages` array with proper structure

### File Conversion Issues
- **PDF parsing errors**: Ensure PDF files are not password-protected or corrupted
- **DOCX parsing errors**: Make sure files are in the newer DOCX format (not older DOC)
- **Empty output**: Check that source files contain extractable text content
- **Large files**: Use chunking settings to split very large documents

## License

MIT
