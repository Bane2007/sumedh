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
    'Upgrade-Insecure-Requests': '1',
    'Referer': f'https://letterboxd.com/{letterboxd_user}/films/'
}

# --- Helper to clean MAL image URLs ---
def clean_mal_image_url(url):
    if not url:
        return ""
    # Remove resizing path segment (e.g., /r/192x272)
    cleaned = re.sub(r'/r/\d+x\d+', '', url)
    # Remove query string parameters (e.g., ?s=...)
    cleaned = cleaned.split('?')[0]
    # Fallback webp to standard jpg format for maximum compatibility
    cleaned = cleaned.replace('.webp', '.jpg')
    return cleaned

# --- Helper to parse MAL dates to ISO format ---
def parse_mal_date_to_iso(date_str, fallback_timestamp=0):
    if not date_str or date_str == "None" or not isinstance(date_str, str):
        if fallback_timestamp:
            return time.strftime('%Y-%m-%d', time.localtime(fallback_timestamp))
        return "N/A"
    
    parts = date_str.split('-')
    if len(parts) != 3:
        return date_str
        
    day, month, year = parts
    try:
        d = int(day)
        m = int(month)
        y = int(year)
    except ValueError:
        return date_str
        
    if y < 100:
        y = 1900 + y if y > 80 else 2000 + y
        
    if m == 0:
        m = 1
    if d == 0:
        d = 1
        
    return f"{y:04d}-{m:02d}-{d:02d}"

# --- Helper to check if a poster is loadable (returns 200 OK) ---
def is_poster_loadable(url):
    if not url:
        return False
    req = urllib.request.Request(url, headers={'User-Agent': headers['User-Agent']}, method="HEAD")
    try:
        with urllib.request.urlopen(req, timeout=4) as r:
            return r.status == 200
    except Exception:
        return False

# --- Helper to resolve poster from film page ---
def resolve_poster_from_page(slug):
    url = f"https://letterboxd.com/film/{slug}/"
    req = urllib.request.Request(url, headers=headers)
    try:
        time.sleep(1.5)  # Respectful delay
        with urllib.request.urlopen(req) as response:
            content = response.read().decode('utf-8')
        scripts = re.findall(r'<script type="application/ld\+json">(.*?)</script>', content, re.DOTALL)
        if scripts:
            s_clean = scripts[0].strip()
            if s_clean.startswith("/*"):
                s_clean = re.sub(r'/\*\s*<!\[CDATA\[\s*\*/', '', s_clean)
                s_clean = re.sub(r'/\*\s*\]\]>\s*\*/', '', s_clean)
            data = json.loads(s_clean.strip())
            img_url = data.get("image")
            if img_url:
                return img_url
    except Exception as e:
        print(f"Error resolving poster for {slug}: {e}")
    return ""

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

# --- 1. FETCH LETTERBOXD FILMS ---
def fetch_letterboxd_films():
    films = []
    page = 1
    print(f"Starting crawl for Letterboxd user: {letterboxd_user}")
    
    # 1. Fetch RSS to get exact watch dates for recent films
    rss_dates = {}
    try:
        print("Fetching RSS feed for movie watch dates...")
        rss_url = f"https://letterboxd.com/{letterboxd_user}/rss/"
        rss_req = urllib.request.Request(rss_url, headers=headers)
        with urllib.request.urlopen(rss_req) as response:
            rss_content = response.read().decode('utf-8')
        
        items = re.findall(r'<item>(.*?)</item>', rss_content, re.DOTALL)
        for item in items:
            link_match = re.search(r'<link>(.*?)</link>', item)
            date_match = re.search(r'<letterboxd:watchedDate>(.*?)</letterboxd:watchedDate>', item)
            if link_match and date_match:
                link = link_match.group(1).strip()
                watch_date = date_match.group(1).strip()
                slug_match = re.search(r'/film/([^/]+)/?$', link)
                if slug_match:
                    slug = slug_match.group(1)
                    rss_dates[slug] = watch_date
        print(f"Loaded {len(rss_dates)} watch dates from RSS.")
    except Exception as e:
        print(f"Failed to fetch or parse RSS for watch dates: {e}")
        
    # 2. Load existing films.json cache
    cached_films_dict = {}
    fallback_path = os.path.join("assets", "data", "films.json")
    if os.path.exists(fallback_path):
        try:
            with open(fallback_path, "r", encoding="utf-8") as f:
                cached_list = json.load(f)
                for item in cached_list:
                    if item.get("slug"):
                        cached_films_dict[item["slug"]] = item
            print(f"Loaded {len(cached_films_dict)} films from cache.")
        except Exception as e:
            print(f"Failed to read cache fallback: {e}")

    while True:
        url = f"https://letterboxd.com/{letterboxd_user}/films/by/date/page/{page}/"
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
            
            # Check cache for image_url
            image_url = ""
            cached_item = cached_films_dict.get(slug)
            if cached_item and cached_item.get("image") and not ("empty-poster" in cached_item["image"]):
                image_url = cached_item["image"]
                
            if not image_url:
                # Find uid for image URL construction
                uid_pattern = rf'data-item-slug="{re.escape(slug)}".*?uid&quot;:&quot;film:(\d+)&quot;'
                uid_match = re.search(uid_pattern, content, re.DOTALL)
                
                if uid_match:
                    film_id = uid_match.group(1)
                    path_digits = "/".join(list(film_id))
                    default_image_url = f"https://a.ltrbxd.com/resized/film-poster/{path_digits}/{film_id}-{slug}-0-150-0-225-crop.jpg"
                    
                    # Check loadability
                    print(f"Checking poster loadability for: {name}")
                    if is_poster_loadable(default_image_url):
                        image_url = default_image_url
                    else:
                        print(f"Default poster failed for {name}. Resolving via detail page...")
                        resolved_url = resolve_poster_from_page(slug)
                        if resolved_url:
                            image_url = resolved_url
                            print(f"Resolved poster for {name}: {image_url}")
                        else:
                            image_url = default_image_url
                            print(f"Fallback to default URL for {name}.")
                else:
                    image_url = ""
            
            watch_date = rss_dates.get(slug, "N/A")
            if cached_item and watch_date == "N/A":
                watch_date = cached_item.get("watched_date", "N/A")
            
            if not any(f['slug'] == slug for f in films):
                films.append({
                    'title': name,
                    'slug': slug,
                    'year': year,
                    'rating': rating,
                    'image': image_url,
                    'watched_date': watch_date
                })
                page_films_count += 1
                
        print(f"Letterboxd Page {page}: Extracted {page_films_count} unique films. Total: {len(films)}")
        page += 1
        time.sleep(3.5)
        
    # Local fallback in case of rate-limiting or partial fetch
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

# --- 2. FETCH MYANIMELIST ANIME ---
def fetch_mal_anime():
    anime_list = []
    
    # Completed Anime
    print(f"Fetching completed Anime for MAL user: {mal_user}")
    url_completed = f"https://myanimelist.net/animelist/{mal_user}/load.json?status=2"
    req_completed = urllib.request.Request(url_completed, headers=headers)
    try:
        with urllib.request.urlopen(req_completed) as response:
            data = json.loads(response.read().decode('utf-8'))
            for item in data:
                title = item.get('anime_title') or item.get('anime_title_eng')
                date_str = item.get('anime_start_date_string') or item.get('start_date_string')
                year = extract_year_from_mal_date(date_str)
                
                start_str = item.get('start_date_string')
                finish_str = item.get('finish_date_string')
                created_val = item.get('created_at') or item.get('updated_at') or 0
                updated_val = item.get('updated_at') or item.get('created_at') or 0
                
                start_date = parse_mal_date_to_iso(start_str)
                finish_date = parse_mal_date_to_iso(finish_str)
                sort_date = finish_date if finish_date != "N/A" else (start_date if start_date != "N/A" else parse_mal_date_to_iso(None, created_val))
                
                anime_list.append({
                    'title': title,
                    'id': item.get('anime_id'),
                    'url': 'https://myanimelist.net' + item.get('anime_url', ''),
                    'year': year,
                    'score': item.get('score', 0),
                    'image': clean_mal_image_url(item.get('anime_image_path', '')),
                    'genres': [g['name'] for g in item.get('genres', [])],
                    'episodes': item.get('num_watched_episodes', 0),
                    'updated_at': updated_val,
                    'status': 'completed',
                    'start_date': start_date,
                    'finish_date': finish_date,
                    'sort_date': sort_date
                })
        print(f"Fetched {len(data)} completed Anime entries.")
    except Exception as e:
        print(f"Failed to fetch MAL completed Anime list: {e}")
        
    # Currently Watching Anime
    print(f"Fetching currently watching Anime for MAL user: {mal_user}")
    url_watching = f"https://myanimelist.net/animelist/{mal_user}/load.json?status=1"
    req_watching = urllib.request.Request(url_watching, headers=headers)
    try:
        with urllib.request.urlopen(req_watching) as response:
            data = json.loads(response.read().decode('utf-8'))
            for item in data:
                title = item.get('anime_title') or item.get('anime_title_eng')
                date_str = item.get('anime_start_date_string') or item.get('start_date_string')
                year = extract_year_from_mal_date(date_str)
                
                start_str = item.get('start_date_string')
                finish_str = item.get('finish_date_string')
                updated_val = item.get('updated_at') or item.get('created_at') or 0
                
                start_date = parse_mal_date_to_iso(start_str)
                finish_date = parse_mal_date_to_iso(finish_str)
                sort_date = start_date if start_date != "N/A" else parse_mal_date_to_iso(None, updated_val)
                
                anime_list.append({
                    'title': title,
                    'id': item.get('anime_id'),
                    'url': 'https://myanimelist.net' + item.get('anime_url', ''),
                    'year': year,
                    'score': item.get('score', 0),
                    'image': clean_mal_image_url(item.get('anime_image_path', '')),
                    'genres': [g['name'] for g in item.get('genres', [])],
                    'episodes': item.get('num_watched_episodes', 0),
                    'updated_at': updated_val,
                    'status': 'watching',
                    'start_date': start_date,
                    'finish_date': finish_date,
                    'sort_date': sort_date
                })
        print(f"Fetched {len(data)} watching Anime entries.")
    except Exception as e:
        print(f"Failed to fetch MAL watching list: {e}")

    # Sort merged list by sort_date descending
    anime_list.sort(key=lambda x: x.get('sort_date', ''), reverse=True)
    return anime_list

# --- 3. FETCH MYANIMELIST MANGA ---
def fetch_mal_manga():
    manga_list = []
    
    # Completed Manga
    print(f"Fetching completed Manga for MAL user: {mal_user}")
    url_completed = f"https://myanimelist.net/mangalist/{mal_user}/load.json?status=2"
    req_completed = urllib.request.Request(url_completed, headers=headers)
    try:
        with urllib.request.urlopen(req_completed) as response:
            data = json.loads(response.read().decode('utf-8'))
            for item in data:
                title = item.get('manga_title') or item.get('manga_english')
                date_str = item.get('manga_start_date_string') or item.get('start_date_string')
                year = extract_year_from_mal_date(date_str)
                
                start_str = item.get('start_date_string')
                finish_str = item.get('finish_date_string')
                created_val = item.get('created_at') or item.get('updated_at') or 0
                updated_val = item.get('updated_at') or item.get('created_at') or 0
                
                start_date = parse_mal_date_to_iso(start_str)
                finish_date = parse_mal_date_to_iso(finish_str)
                sort_date = finish_date if finish_date != "N/A" else (start_date if start_date != "N/A" else parse_mal_date_to_iso(None, created_val))
                
                manga_list.append({
                    'title': title,
                    'id': item.get('manga_id'),
                    'url': 'https://myanimelist.net' + item.get('manga_url', ''),
                    'year': year,
                    'score': item.get('score', 0),
                    'image': clean_mal_image_url(item.get('manga_image_path', '')),
                    'genres': [g['name'] for g in item.get('genres', [])],
                    'chapters': item.get('num_read_chapters', 0),
                    'volumes': item.get('num_read_volumes', 0),
                    'updated_at': updated_val,
                    'status': 'completed',
                    'start_date': start_date,
                    'finish_date': finish_date,
                    'sort_date': sort_date
                })
        print(f"Fetched {len(data)} completed Manga entries.")
    except Exception as e:
        print(f"Failed to fetch MAL completed Manga list: {e}")
        
    # Currently Reading Manga
    print(f"Fetching currently reading Manga for MAL user: {mal_user}")
    url_reading = f"https://myanimelist.net/mangalist/{mal_user}/load.json?status=1"
    req_reading = urllib.request.Request(url_reading, headers=headers)
    try:
        with urllib.request.urlopen(req_reading) as response:
            data = json.loads(response.read().decode('utf-8'))
            for item in data:
                title = item.get('manga_title') or item.get('manga_english')
                date_str = item.get('manga_start_date_string') or item.get('start_date_string')
                year = extract_year_from_mal_date(date_str)
                
                start_str = item.get('start_date_string')
                finish_str = item.get('finish_date_string')
                updated_val = item.get('updated_at') or item.get('created_at') or 0
                
                start_date = parse_mal_date_to_iso(start_str)
                finish_date = parse_mal_date_to_iso(finish_str)
                sort_date = start_date if start_date != "N/A" else parse_mal_date_to_iso(None, updated_val)
                
                manga_list.append({
                    'title': title,
                    'id': item.get('manga_id'),
                    'url': 'https://myanimelist.net' + item.get('manga_url', ''),
                    'year': year,
                    'score': item.get('score', 0),
                    'image': clean_mal_image_url(item.get('manga_image_path', '')),
                    'genres': [g['name'] for g in item.get('genres', [])],
                    'chapters': item.get('num_read_chapters', 0),
                    'volumes': item.get('num_read_volumes', 0),
                    'updated_at': updated_val,
                    'status': 'reading',
                    'start_date': start_date,
                    'finish_date': finish_date,
                    'sort_date': sort_date
                })
        print(f"Fetched {len(data)} reading Manga entries.")
    except Exception as e:
        print(f"Failed to fetch MAL reading list: {e}")

    # Sort merged list by sort_date descending
    manga_list.sort(key=lambda x: x.get('sort_date', ''), reverse=True)
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
