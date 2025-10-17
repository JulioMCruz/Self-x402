#!/bin/bash

# Start ngrok tunnel with custom domain
# Make sure ngrok is installed: brew install ngrok
# And authenticated: ngrok config add-authtoken YOUR_TOKEN

echo "🚀 Starting ngrok tunnel for Celo Facilitator..."
echo "📍 Domain: http://codalabs.ngrok.io"
echo "📡 Local Port: 3005"
echo ""

# Start ngrok with custom domain
ngrok http --domain=codalabs.ngrok.io 3005
