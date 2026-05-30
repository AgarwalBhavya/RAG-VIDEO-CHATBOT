# RAG Video Chatbot - Setup & Deployment Guide

## Prerequisites

- Docker & Docker Compose
- Node.js 18+
- Python 3.11+
- API keys for: OpenAI, Claude (Anthropic), YouTube Data API

---

## API Key Setup

### 1. OpenAI API Key

1. Go to https://platform.openai.com/api-keys
2. Create a new API key
3. Save it securely

```bash
export OPENAI_API_KEY="sk-..."
```

### 2. Anthropic Claude API Key

1. Go to https://console.anthropic.com/
2. Create API key in dashboard
3. Save it securely

```bash
export CLAUDE_API_KEY="sk-ant-..."
```

### 3. YouTube Data API Key

1. Go to https://console.cloud.google.com/
2. Create new project
3. Enable "YouTube Data API v3"
4. Create OAuth 2.0 credentials (API Key)
5. Copy the key

```bash
export YOUTUBE_API_KEY="AIza..."
```

### 4. Create .env file

```bash
cat > .env << EOF
OPENAI_API_KEY=sk-...
CLAUDE_API_KEY=sk-ant-...
YOUTUBE_API_KEY=AIza...
QDRANT_URL=http://localhost:6333
QDRANT_API_KEY=default-key
EOF
```

---

## Local Development Setup

### Option 1: Using Docker Compose (Recommended)

```bash
# Clone/download repository
cd rag-video-chatbot

# Load environment variables
source .env

# Start all services
docker-compose up -d

# Check services are running
docker-compose ps

# View logs
docker-compose logs -f backend
docker-compose logs -f frontend
```

Access:
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:8000
- **Qdrant**: http://localhost:6333/dashboard

### Option 2: Manual Setup

#### 1. Start Qdrant

```bash
docker run -d \
  -p 6333:6333 \
  -v qdrant_storage:/qdrant/storage \
  --name qdrant \
  qdrant/qdrant:latest
```

#### 2. Install Backend Dependencies

```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

pip install -r requirements.txt
```

#### 3. Run Backend

```bash
source .env
python backend.py
# Server runs on http://localhost:8000
```

#### 4. Install Frontend Dependencies

```bash
npm install
npm run dev
# Frontend runs on http://localhost:5173
```

---

## Testing the System

### Test 1: Health Check

```bash
curl http://localhost:8000/health
# Response: {"status": "healthy"}
```

### Test 2: Video Ingestion

```bash
curl -X POST http://localhost:8000/ingest \
  -H "Content-Type: application/json" \
  -d '{
    "video_a_url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    "video_b_url": "https://www.youtube.com/watch?v=9bZkp7q19f0"
  }'
```

Expected response:
```json
{
  "video_a": {
    "status": "success",
    "metadata": {
      "video_id": "dQw4w9WgXcQ",
      "platform": "youtube",
      "title": "Video Title",
      "views": 1000000,
      "likes": 50000,
      "comments": 10000,
      "engagement_rate": 6.0,
      ...
    },
    "chunks": 25
  },
  "video_b": {
    "status": "success",
    ...
  }
}
```

### Test 3: Chat Endpoint

```bash
curl -X POST http://localhost:8000/chat \
  -H "Content-Type: application/json" \
  -d '{
    "video_a_url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    "video_b_url": "https://www.youtube.com/watch?v=9bZkp7q19f0",
    "question": "Why does video A have better engagement?"
  }' \
  | jq .
```

---

## Production Deployment

### AWS ECS Deployment

#### 1. Create ECR Repositories

```bash
aws ecr create-repository --repository-name rag-backend --region us-east-1
aws ecr create-repository --repository-name rag-frontend --region us-east-1
```

#### 2. Build and Push Images

```bash
AWS_ACCOUNT=$(aws sts get-caller-identity --query Account --output text)
ECR_REPO="$AWS_ACCOUNT.dkr.ecr.us-east-1.amazonaws.com"

# Backend
docker build -t $ECR_REPO/rag-backend:latest .
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin $ECR_REPO
docker push $ECR_REPO/rag-backend:latest

# Frontend
docker build -t $ECR_REPO/rag-frontend:latest -f Dockerfile.frontend .
docker push $ECR_REPO/rag-frontend:latest
```

#### 3. Deploy with CloudFormation

```bash
aws cloudformation create-stack \
  --stack-name rag-chatbot-prod \
  --template-body file://cloudformation.yaml \
  --parameters \
    ParameterKey=OpenAIKey,ParameterValue=$OPENAI_API_KEY \
    ParameterKey=ClaudeKey,ParameterValue=$CLAUDE_API_KEY \
    ParameterKey=YoutubeKey,ParameterValue=$YOUTUBE_API_KEY \
  --capabilities CAPABILITY_IAM
```

#### 4. Monitor Deployment

```bash
aws cloudformation describe-stacks --stack-name rag-chatbot-prod

# Get load balancer URL
aws cloudformation describe-stack-resource \
  --stack-name rag-chatbot-prod \
  --logical-resource-id LoadBalancer
```

### Kubernetes Deployment

```yaml
# deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: rag-backend
spec:
  replicas: 3
  selector:
    matchLabels:
      app: rag-backend
  template:
    metadata:
      labels:
        app: rag-backend
    spec:
      containers:
      - name: backend
        image: ecr.io/account-id/rag-backend:latest
        ports:
        - containerPort: 8000
        env:
        - name: OPENAI_API_KEY
          valueFrom:
            secretKeyRef:
              name: api-keys
              key: openai
        - name: CLAUDE_API_KEY
          valueFrom:
            secretKeyRef:
              name: api-keys
              key: claude
        - name: QDRANT_URL
          value: http://qdrant-service:6333
        resources:
          requests:
            cpu: "500m"
            memory: "512Mi"
          limits:
            cpu: "1000m"
            memory: "1Gi"
        livenessProbe:
          httpGet:
            path: /health
            port: 8000
          initialDelaySeconds: 30
          periodSeconds: 10
```

Deploy:
```bash
kubectl apply -f deployment.yaml
kubectl apply -f service.yaml
kubectl apply -f ingress.yaml
```

---

## Monitoring & Observability

### CloudWatch Monitoring

```python
# Add to backend.py
import logging
import json
import boto3

cloudwatch = boto3.client('cloudwatch')

@app.post("/chat")
async def chat(request: ChatRequest):
    start_time = time.time()
    
    try:
        # ... process request ...
        duration = (time.time() - start_time) * 1000
        
        cloudwatch.put_metric_data(
            Namespace='RAG-Chatbot',
            MetricData=[
                {
                    'MetricName': 'ChatLatency',
                    'Value': duration,
                    'Unit': 'Milliseconds'
                },
                {
                    'MetricName': 'SuccessfulChats',
                    'Value': 1,
                    'Unit': 'Count'
                }
            ]
        )
    except Exception as e:
        cloudwatch.put_metric_data(
            Namespace='RAG-Chatbot',
            MetricData=[
                {
                    'MetricName': 'FailedChats',
                    'Value': 1,
                    'Unit': 'Count'
                }
            ]
        )
        raise
```

### Set Alarms

```bash
aws cloudwatch put-metric-alarm \
  --alarm-name rag-high-latency \
  --alarm-description "Alert when chat latency exceeds 5s" \
  --metric-name ChatLatency \
  --namespace RAG-Chatbot \
  --statistic Average \
  --period 60 \
  --threshold 5000 \
  --comparison-operator GreaterThanThreshold \
  --alarm-actions arn:aws:sns:us-east-1:account:topic
```

---

## Performance Tuning

### 1. Database Optimization

```python
# Add indexing for frequently filtered fields
qdrant_client.create_payload_index(
    collection_name="video_transcripts",
    field_name="video_id",
    field_schema=models.PayloadSchemaType.KEYWORD,
)
```

### 2. Caching Strategy

```python
from functools import lru_cache

@lru_cache(maxsize=1000)
async def get_cached_metadata(video_id: str):
    # Cache metadata for 24 hours
    return await fetch_video_metadata(video_id)
```

### 3. Batch Processing

```python
# Process multiple videos concurrently
import asyncio

async def ingest_batch(urls: List[str]):
    tasks = [ingest_single_video(url) for url in urls]
    return await asyncio.gather(*tasks)
```

---

## Troubleshooting

### Issue: "Connection refused to Qdrant"

```bash
# Check if Qdrant is running
docker ps | grep qdrant

# Check Qdrant logs
docker logs qdrant

# Restart Qdrant
docker restart qdrant
```

### Issue: "YouTube transcript not available"

```bash
# Some videos have transcripts disabled
# The system will use video description as fallback
# Check that YouTube API key is valid:
curl "https://www.googleapis.com/youtube/v3/videos?id=dQw4w9WgXcQ&key=${YOUTUBE_API_KEY}&part=snippet"
```

### Issue: "High API costs"

```bash
# 1. Enable embedding caching
# 2. Implement batch embeddings
# 3. Set rate limits per user
# 4. Monitor API usage:
curl https://api.openai.com/dashboard/billing/overview -H "Authorization: Bearer $OPENAI_API_KEY"
```

### Issue: "Slow response times"

```bash
# 1. Check Qdrant latency
curl http://localhost:6333/health

# 2. Monitor FastAPI worker threads
# 3. Add more replicas if behind load balancer
# 4. Check network between containers
docker network inspect rag_network
```

---

## Cleanup

### Stop Services

```bash
# Using Docker Compose
docker-compose down

# Using Docker
docker stop qdrant rag_backend rag_frontend
docker rm qdrant rag_backend rag_frontend
```

### Remove Volumes

```bash
docker volume rm qdrant_storage rag_qdrant_storage
```

### Full Cleanup

```bash
docker-compose down -v  # Removes volumes too
```

---

## Support & Resources

- **LangGraph Docs**: https://langchain-ai.github.io/langgraph/
- **Qdrant Docs**: https://qdrant.tech/documentation/
- **OpenAI API**: https://platform.openai.com/docs
- **YouTube API**: https://developers.google.com/youtube/v3
- **FastAPI**: https://fastapi.tiangolo.com/

---

## Next Steps

1. ✅ Get API keys (see above)
2. ✅ Set up .env file
3. ✅ Run `docker-compose up`
4. ✅ Open http://localhost:5173
5. ✅ Test with sample YouTube URLs
6. ✅ Deploy to production when ready