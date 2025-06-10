import pandas as pd

def convert_to_sankey_data(df):
    # Ensure input DataFrame has required columns
    required_columns = ['source', 'target', 'value']
    if not all(col in df.columns for col in required_columns):
        raise ValueError(f"DataFrame must contain columns: {required_columns}")

    # Get unique nodes from source and target columns
    all_nodes = pd.unique(df[['source', 'target']].values.ravel())
    nodes = [{'name': node, 'value': 0} for node in all_nodes]  # Initialize with zero value, can be updated later

    # Create a mapping from node names to indices
    node_map = {node: i for i, node in enumerate(all_nodes)}

    # Convert links to use node indices
    links = df.apply(lambda row: {
        'source': node_map[row['source']],
        'target': node_map[row['target']],
        'value': row['value']
    }, axis=1).tolist()

    # Optionally update node values based on total incoming/outgoing flows (if desired)
    for link in links:
        nodes[link['source']]['value'] += link['value']
        nodes[link['target']]['value'] += link['value']

    return {
        'nodes': nodes,
        'links': links,
        'metrics': []  # Placeholder for metrics, can be extended if needed
    }

# Example usage
if __name__ == "__main__":
    # Sample DataFrame
    data = {
        'source': ['Retail', 'Technology', 'Education', 'Healthcare', 'Manufacturing'],
        'target': ['Technology', 'Education', 'Healthcare', 'Manufacturing', 'Finance'],
        'value': [500, 300, 200, 150, 250]
    }
    df = pd.DataFrame(data)

    # Convert to Sankey data
    sankey_data = convert_to_sankey_data(df)

    # Print result to verify
    print("Nodes:", sankey_data['nodes'])
    print("Links:", sankey_data['links'])