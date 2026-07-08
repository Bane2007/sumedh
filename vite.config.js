import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'fs'
import path from 'path'

// Custom plugin to handle local database logging
const localDbPlugin = () => ({
  name: 'local-db-plugin',
  configureServer(server) {
    server.middlewares.use((req, res, next) => {
      if (req.url === '/api/log-item' && req.method === 'POST') {
        let body = '';
        req.on('data', chunk => {
          body += chunk.toString();
        });
        req.on('end', () => {
          try {
            const { category, item } = JSON.parse(body);
            const mediaPath = path.resolve(__dirname, 'public/assets/data/media.js');
            let content = fs.readFileSync(mediaPath, 'utf8');
            
            // Extract the JSON object from the file
            const jsonStr = content.replace('window.mediaDatabase = ', '');
            const db = JSON.parse(jsonStr);
            
            // Prepend new item
            db[category] = [item, ...db[category]];
            
            // Write back to file
            const newContent = 'window.mediaDatabase = ' + JSON.stringify(db, null, 2);
            fs.writeFileSync(mediaPath, newContent, 'utf8');
            
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: true }));
          } catch (err) {
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: false, error: err.message }));
          }
        });
      } else if (req.url === '/api/sync-debts' && req.method === 'POST') {
        let body = '';
        req.on('data', chunk => {
          body += chunk.toString();
        });
        req.on('end', () => {
          try {
            const list = JSON.parse(body);
            const debtsPath = path.resolve(__dirname, 'public/assets/data/debts.json');
            fs.writeFileSync(debtsPath, JSON.stringify(list, null, 2), 'utf8');
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: true }));
          } catch (err) {
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: false, error: err.message }));
          }
        });
      } else if (req.url === '/api/delete-item' && req.method === 'POST') {
        let body = '';
        req.on('data', chunk => {
          body += chunk.toString();
        });
        req.on('end', () => {
          try {
            const { category, itemToRemove } = JSON.parse(body);
            const mediaPath = path.resolve(__dirname, 'public/assets/data/media.js');
            let content = fs.readFileSync(mediaPath, 'utf8');
            
            const jsonStr = content.replace('window.mediaDatabase = ', '');
            const db = JSON.parse(jsonStr);
            
            // Filter out item
            db[category] = db[category].filter(item => {
              if (category === 'films') {
                return item.slug !== itemToRemove.slug;
              } else {
                return item.id !== itemToRemove.id;
              }
            });
            
            // Write back to file
            const newContent = 'window.mediaDatabase = ' + JSON.stringify(db, null, 2);
            fs.writeFileSync(mediaPath, newContent, 'utf8');
            
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: true }));
          } catch (err) {
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: false, error: err.message }));
          }
        });
      } else {
        next();
      }
    });
  }
});

export default defineConfig({
  plugins: [react(), localDbPlugin()],
  base: '/sumedh/',
});
