import re
import os

file_path = r"c:\Milan\GIT\SahabatBradPitt\apps\films\services\main_service.py"

with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

# 1. Add _parse_actor_person_data
parse_method = """
    def _parse_actor_person_data(self, person_data):
        parsed = {}
        if person_data.get("birthday"):
            parsed['birthday'] = person_data.get("birthday")
        else:
            parsed['birthday'] = None
            
        parsed['deathday'] = person_data.get("deathday")
        parsed['gender'] = person_data.get("gender")
        parsed['place_of_birth'] = person_data.get("place_of_birth")
        parsed['known_for_department'] = person_data.get("known_for_department")
        
        ext_ids = person_data.get("external_ids", {})
        parsed['instagram_id'] = ext_ids.get("instagram_id")
        parsed['twitter_id'] = ext_ids.get("twitter_id")
        parsed['facebook_id'] = ext_ids.get("facebook_id")
        parsed['tiktok_id'] = ext_ids.get("tiktok_id")
        
        # hapus None value supaya tidak menimpa dengan None bila tidak perlu, walau update_or_create bakal pakai None 
        # (tidak masalah karena kalau None dari API artinya tidak ada)
        return parsed

    def _get_protected_actor_names(self, tmdb_id, name, native_name):"""

content = content.replace("    def _get_protected_actor_names(self, tmdb_id, name, native_name):", parse_method)

# 2. Append append_to_response=external_ids to API calls
# person_res = requests.get(person_url, headers=self.headers, params={"api_key": self.api_key}, timeout=10)
content = content.replace('params={"api_key": self.api_key}', 'params={"api_key": self.api_key, "append_to_response": "external_ids"}')

# 3. Update the update_or_create defaults to use the parsed data
# There are several blocks of update_or_create for Actor.
# Let's find all occurrences of Actor.objects.update_or_create
# and inject the parsed_data. But parsed_data might not exist.
# We'll initialize `extra_actor_fields = {}` before they are fetched, update them, and add to defaults.

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)
print("Basic replacements done.")
