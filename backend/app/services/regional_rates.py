"""Regional labour rate defaults for UK postcode areas"""

# London postcode areas with typical labour rates (£/hr)
LONDON_RATES = {
    "SW": 75,   # Southwest London (Chelsea, Kensington, Wandsworth)
    "W": 80,    # West London (Notting Hill, Hammersmith)
    "NW": 70,   # Northwest London (Camden, Hampstead)
    "N": 65,    # North London (Islington, Finsbury)
    "E": 60,    # East London (Hackney, Tower Hamlets)
    "SE": 65,   # Southeast London (Greenwich, Lewisham)
    "EC": 85,   # City of London (Financial district)
    "WC": 85,   # West Central (Covent Garden, Holborn)
}

# Other UK regions (approximate rates)
UK_REGIONAL_RATES = {
    # Southeast England
    "GU": 65,   # Guildford
    "RH": 65,   # Redhill
    "TN": 60,   # Tonbridge
    "BR": 65,   # Bromley
    
    # Home Counties
    "AL": 65,   # St Albans
    "HP": 65,   # Hemel Hempstead
    "SL": 70,   # Slough
    "WD": 65,   # Watford
    
    # Major Cities
    "M": 60,    # Manchester
    "B": 55,    # Birmingham
    "LS": 55,   # Leeds
    "BS": 60,   # Bristol
    "EH": 60,   # Edinburgh
    "G": 55,    # Glasgow
    
    # Default for unknown areas
    "DEFAULT": 65
}

def get_regional_labour_rate(address: str, region: str) -> float:
    """
    Extract postcode area from address/region and return appropriate labour rate.
    
    Args:
        address: Property address
        region: Region string (e.g., "London, UK")
        
    Returns:
        Labour rate in £/hr based on postcode area
    """
    import re
    
    # Combine address and region for searching
    search_text = f"{address} {region}".upper()
    
    # Try to extract UK postcode pattern (e.g., SW1A, W1, EC2)
    postcode_pattern = r'\b([A-Z]{1,2}\d{1,2}[A-Z]?)\b'
    matches = re.findall(postcode_pattern, search_text)
    
    if matches:
        # Get the area code (letters only)
        postcode_area = re.match(r'([A-Z]+)', matches[0]).group(1)
        
        # Check London rates first
        if postcode_area in LONDON_RATES:
            return LONDON_RATES[postcode_area]
        
        # Check UK regional rates
        if postcode_area in UK_REGIONAL_RATES:
            return UK_REGIONAL_RATES[postcode_area]
    
    # Check if "London" is mentioned
    if "LONDON" in search_text:
        return 70  # Average London rate
    
    # Default rate
    return UK_REGIONAL_RATES["DEFAULT"]
