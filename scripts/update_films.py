import urllib.request
import re
import json
import time
import os

username = "Bane_snj"
headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
}

films = []
page = 1

print(f"Starting crawl for Letterboxd user: {username}")

while True:
    url = f"https://letterboxd.com/{username}/films/page/{page}/"
    req = urllib.request.Request(url, headers=headers)
    
    try:
        print(f"Fetching page {page}...")
        with urllib.request.urlopen(req) as response:
            content = response.read().decode('utf-8')
    except urllib.error.HTTPError as e:
        if e.code == 404:
            print(f"Finished crawling (Page {page} returned 404).")
            break
        else:
            print(f"HTTP Error {e.code} on page {page}. Stopping.")
            break
    except Exception as e:
        print(f"Error fetching page {page}: {e}. Stopping.")
        break
        
    # Extract film details using regex
    pattern = r'data-item-name="([^"]+)"\s+data-item-slug="([^"]+)"\s+data-item-link="([^"]+)"'
    matches = re.findall(pattern, content)
    
    if not matches:
        print(f"No movies found on page {page}. Stopping.")
        break
        
    page_films_count = 0
    for name_with_year, slug, link in matches:
        year_match = re.search(r'\s*\((\d{4})\)$', name_with_year)
        if year_match:
            year = year_match.group(1)
            name = name_with_year[:-7].strip()
        else:
            year = "N/A"
            name = name_with_year.strip()
            
        rating_pattern = rf'data-item-slug="{re.escape(slug)}".*?rated-(\d+)">([^<]+)</span>'
        rating_match = re.search(rating_pattern, content, re.DOTALL)
        rating = rating_match.group(2).strip() if rating_match else ""
        
        if not any(f['slug'] == slug for f in films):
            films.append({
                'title': name,
                'slug': slug,
                'year': year,
                'rating': rating
            })
            page_films_count += 1
            
    print(f"Page {page}: Extracted {page_films_count} unique films. Total so far: {len(films)}")
    
    page += 1
    time.sleep(1.5) # Polite delay between requests

if len(films) > 0:
    print(f"Successfully extracted {len(films)} total unique films.")
    
    # Save JSON file
    json_path = os.path.join("assets", "data", "films.json")
    os.makedirs(os.path.dirname(json_path), exist_ok=True)
    with open(json_path, "w", encoding="utf-8") as out_json:
        json.dump(films, out_json, indent=2, ensure_ascii=False)
    print(f"Saved JSON data to {json_path}")
    
    # Save JS file
    js_path = os.path.join("assets", "data", "films.js")
    with open(js_path, "w", encoding="utf-8") as out_js:
        out_js.write("window.letterboxdFilms = " + json.dumps(films, indent=2, ensure_ascii=False))
    print(f"Saved JS data to {js_path}")
else:
    print("No films extracted. Files were not updated.")
