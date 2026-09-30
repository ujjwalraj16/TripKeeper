"""
services/route_optimizer.py — Optimize the order of places within a day using Haversine distance, Nearest Neighbor, and 2-opt.
"""

import math
from typing import List, Tuple

def haversine(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Calculate the great circle distance between two points in km."""
    R = 6371.0 # Earth radius in km
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    
    a = (math.sin(dlat / 2) ** 2) + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * (math.sin(dlon / 2) ** 2)
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return R * c


def calculate_total_distance(route: List[Tuple[float, float]]) -> float:
    """Calculate the total distance of a route."""
    dist = 0.0
    for i in range(len(route) - 1):
        dist += haversine(route[i][0], route[i][1], route[i+1][0], route[i+1][1])
    return dist


def nearest_neighbor(points: List[Tuple[float, float]]) -> List[int]:
    """Return an ordered list of indices using the nearest neighbor heuristic."""
    if not points:
        return []
    
    unvisited = set(range(1, len(points)))
    route = [0]
    
    current = 0
    while unvisited:
        next_node = min(unvisited, key=lambda node: haversine(points[current][0], points[current][1], points[node][0], points[node][1]))
        route.append(next_node)
        unvisited.remove(next_node)
        current = next_node
        
    return route


def two_opt(points: List[Tuple[float, float]], route: List[int], max_iterations: int = 100) -> List[int]:
    """Improve the route using the 2-opt algorithm."""
    best_route = route
    best_distance = calculate_total_distance([points[i] for i in best_route])
    
    improved = True
    iterations = 0
    
    while improved and iterations < max_iterations:
        improved = False
        for i in range(1, len(best_route) - 2):
            for j in range(i + 1, len(best_route)):
                if j - i == 1:
                    continue # No point in reversing adjacent nodes
                
                new_route = best_route[:]
                new_route[i:j] = reversed(best_route[i:j])
                new_distance = calculate_total_distance([points[idx] for idx in new_route])
                
                if new_distance < best_distance:
                    best_route = new_route
                    best_distance = new_distance
                    improved = True
                    
        iterations += 1
        
    return best_route


def optimize_day_route(places: List[dict]) -> List[dict]:
    """
    Takes a list of dictionaries, each containing 'lat' and 'lon'.
    Returns the list sorted by the optimized route order.
    """
    if len(places) <= 2:
        return places
        
    coords = [(p['lat'], p['lon']) for p in places]
    
    # 1. Initial guess using Nearest Neighbor (starting from the first item)
    nn_route_indices = nearest_neighbor(coords)
    
    # 2. Refine using 2-opt
    optimized_indices = two_opt(coords, nn_route_indices)
    
    # 3. Reorder the places based on the optimized indices
    optimized_places = [places[i] for i in optimized_indices]
    
    return optimized_places
