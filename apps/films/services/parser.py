def is_asian_or_non_latin(person_data, name, original_name=None):
    """
    Menentukan apakah seorang aktor/sutradara berasal dari daerah non-Latin
    (seperti Korea, China, Jepang, dll) agar terhindar dari memberikan
    nama native non-Latin untuk aktor Barat (seperti Wes Bentley).
    """
    if name and not name.isascii():
        return True
    if original_name and not original_name.isascii():
        return True
        
    place_of_birth = person_data.get("place_of_birth") or ""
    pob_lower = place_of_birth.lower()
    non_latin_keywords = [
        "korea", "china", "japan", "taiwan", "hong kong", "macau", 
        "singapore", "thailand", "vietnam", "tokyo", "seoul", "beijing",
        "shanghai", "taipei", "bangkok", "viet nam"
    ]
    if any(kw in pob_lower for kw in non_latin_keywords):
        return True
        
    western_countries = [
        "usa", "united states", "uk", "united kingdom", "england", "canada", 
        "australia", "france", "germany", "italy", "spain", "sweden", 
        "norway", "denmark", "ireland", "new zealand"
    ]
    if any(country in pob_lower for country in western_countries):
        return False
        
    also_known_as = person_data.get("also_known_as", [])
    if any(alt and not alt.isascii() for alt in also_known_as):
        return True
        
    return False
