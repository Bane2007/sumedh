import urllib.request
import re
import json
import time
import os

# Config
letterboxd_user = "Bane_snj"
mal_user = "Bane_snj"

headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/115.0',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.5',
    'Connection': 'keep-alive',
    'Upgrade-Insecure-Requests': '1'
}

# --- 1. FETCH LETTERBOXD FILMS ---
def fetch_letterboxd_films():
    films = []
    page = 1
    print(f"Starting crawl for Letterboxd user: {letterboxd_user}")
    
    while True:
        url = f"https://letterboxd.com/{letterboxd_user}/films/page/{page}/"
        req = urllib.request.Request(url, headers=headers)
        
        content = ""
        retries = 3
        while retries > 0:
            try:
                print(f"Fetching Letterboxd page {page}...")
                with urllib.request.urlopen(req) as response:
                    content = response.read().decode('utf-8')
                break # Success
            except urllib.error.HTTPError as e:
                if e.code == 404:
                    print(f"Finished crawling Letterboxd (Page {page} returned 404).")
                    break
                elif e.code == 403:
                    retries -= 1
                    print(f"HTTP Error 403 on Letterboxd page {page}. Retrying in 12 seconds... ({retries} retries left)")
                    time.sleep(12)
                else:
                    print(f"HTTP Error {e.code} on Letterboxd page {page}. Stopping.")
                    break
            except Exception as e:
                print(f"Error fetching Letterboxd page {page}: {e}. Stopping.")
                break
                
        if not content:
            print(f"Unable to retrieve page {page} content. Stopping.")
            break
            
        pattern = r'data-item-name="([^"]+)"\s+data-item-slug="([^"]+)"\s+data-item-link="([^"]+)"'
        matches = re.findall(pattern, content)
        
        if not matches:
            print(f"No movies found on Letterboxd page {page}. Stopping.")
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
            
            # Find uid for image URL construction
            uid_pattern = rf'data-item-slug="{re.escape(slug)}".*?uid&quot;:&quot;film:(\d+)&quot;'
            uid_match = re.search(uid_pattern, content, re.DOTALL)
            
            image_url = ""
            if uid_match:
                film_id = uid_match.group(1)
                path_digits = "/".join(list(film_id))
                image_url = f"https://a.ltrbxd.com/resized/film-poster/{path_digits}/{film_id}-{slug}-0-150-0-225-crop.jpg"
            
            if not any(f['slug'] == slug for f in films):
                films.append({
                    'title': name,
                    'slug': slug,
                    'year': year,
                    'rating': rating,
                    'image': image_url
                })
                page_films_count += 1
                
        print(f"Letterboxd Page {page}: Extracted {page_films_count} unique films. Total: {len(films)}")
        page += 1
        time.sleep(3.5)
        
    # Local fallback in case of rate-limiting or partial fetch
    fallback_path = os.path.join("assets", "data", "films.json")
    if os.path.exists(fallback_path):
        try:
            with open(fallback_path, "r", encoding="utf-8") as f:
                cached_films = json.load(f)
            if len(cached_films) > len(films):
                print(f"Crawled count ({len(films)}) is less than cached count ({len(cached_films)}). Using complete cached list instead.")
                films = cached_films
        except Exception as e:
            print(f"Failed to read fallback: {e}")
    else:
        print("No fallback data found.")
            
    return films

# --- Helper to parse MAL dates to years ---
def extract_year_from_mal_date(date_str):
    if not date_str:
        return "N/A"
    parts = date_str.split('-')
    if len(parts) == 3:
        yr = parts[2]
        if len(yr) == 2:
            return "19" + yr if int(yr) > 80 else "20" + yr
        elif len(yr) == 4:
            return yr
    return date_str

# --- 2. FETCH MYANIMELIST ANIME ---
def fetch_mal_anime():
    print(f"Fetching completed Anime for MAL user: {mal_user}")
    url = f"https://myanimelist.net/animelist/{mal_user}/load.json?status=2"
    req = urllib.request.Request(url, headers=headers)
    anime_list = []
    
    try:
        with urllib.request.urlopen(req) as response:
            data = json.loads(response.read().decode('utf-8'))
            for item in data:
                title = item.get('anime_title_eng') or item.get('anime_title')
                date_str = item.get('anime_start_date_string') or item.get('start_date_string')
                year = extract_year_from_mal_date(date_str)
                anime_list.append({
                    'title': title,
                    'id': item.get('anime_id'),
                    'url': 'https://myanimelist.net' + item.get('anime_url', ''),
                    'year': year,
                    'score': item.get('score', 0),
                    'image': item.get('anime_image_path', ''),
                    'genres': [g['name'] for g in item.get('genres', [])],
                    'episodes': item.get('num_watched_episodes', 0)
                })
        print(f"Successfully fetched {len(anime_list)} Anime entries.")
    except Exception as e:
        print(f"Failed to fetch MAL Anime list: {e}")
        
    return anime_list

# --- 3. FETCH MYANIMELIST MANGA ---
def fetch_mal_manga():
    print(f"Fetching completed Manga for MAL user: {mal_user}")
    url = f"https://myanimelist.net/mangalist/{mal_user}/load.json?status=2"
    req = urllib.request.Request(url, headers=headers)
    manga_list = []
    
    try:
        with urllib.request.urlopen(req) as response:
            data = json.loads(response.read().decode('utf-8'))
            for item in data:
                title = item.get('manga_english') or item.get('manga_title')
                date_str = item.get('manga_start_date_string') or item.get('start_date_string')
                year = extract_year_from_mal_date(date_str)
                manga_list.append({
                    'title': title,
                    'id': item.get('manga_id'),
                    'url': 'https://myanimelist.net' + item.get('manga_url', ''),
                    'year': year,
                    'score': item.get('score', 0),
                    'image': item.get('manga_image_path', ''),
                    'genres': [g['name'] for g in item.get('genres', [])],
                    'chapters': item.get('num_read_chapters', 0),
                    'volumes': item.get('num_read_volumes', 0)
                })
        print(f"Successfully fetched {len(manga_list)} Manga entries.")
    except Exception as e:
        print(f"Failed to fetch MAL Manga list: {e}")
        
    return manga_list

# --- MAIN RUN ---
if __name__ == "__main__":
    films = fetch_letterboxd_films()
    anime = fetch_mal_anime()
    manga = fetch_mal_manga()
    
    # Save output JSON as fallback cache
    films_json_path = os.path.join("assets", "data", "films.json")
    with open(films_json_path, "w", encoding="utf-8") as f_out:
        json.dump(films, f_out, indent=2, ensure_ascii=False)
    
    # Save output JS
    output_js_path = os.path.join("assets", "data", "media.js")
    os.makedirs(os.path.dirname(output_js_path), exist_ok=True)
    
    payload = {
        "films": films,
        "anime": anime,
        "manga": manga
    }
    
    with open(output_js_path, "w", encoding="utf-8") as out:
        out.write("window.mediaDatabase = " + json.dumps(payload, indent=2, ensure_ascii=False))
        
    print(f"Saved complete media database to {output_js_path}")
