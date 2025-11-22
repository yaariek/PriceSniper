# Material cost database

# Define cost ranges (min, max) per unit for common construction materials.
# The values are illustrative and can be refined later.
MATERIAL_COSTS = {
    "roof_tiles": {"unit": "per tile", "cost_range": (5, 15)},
    "roofing_felt": {"unit": "per m²", "cost_range": (6, 12)},
    "nails": {"unit": "per box", "cost_range": (10, 20)},
    "plaster": {"unit": "per litre", "cost_range": (12, 25)},
    "paint": {"unit": "per litre", "cost_range": (15, 40)},
    "copper_pipe": {"unit": "per metre", "cost_range": (8, 20)},
    "drywall": {"unit": "per sheet", "cost_range": (8, 18)},
    "insulation": {"unit": "per m²", "cost_range": (10, 30)},
    "timber": {"unit": "per metre", "cost_range": (5, 12)},
    "concrete": {"unit": "per m³", "cost_range": (70, 120)}
}

def get_material_cost(item_name: str, quantity: float) -> float:
    """Return an estimated total cost for a material.

    The function picks the midpoint of the defined cost range and multiplies by the quantity.
    If the item is not in the database, it returns 0.0 so the caller can handle it.
    """
    entry = MATERIAL_COSTS.get(item_name)
    if not entry:
        return 0.0
    low, high = entry["cost_range"]
    unit_cost = (low + high) / 2
    return round(unit_cost * quantity, 2)
