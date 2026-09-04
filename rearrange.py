import re

with open('components/Profile.tsx', 'r') as f:
    lines = f.readlines()

markers = [
    "{/* Tier Merits Matrix */}",
    "{/* Captured Aesthetics */}",
    "{/* Checkout Protocols */}",
    "{/* Acquisition History */}",
    "{/* Promo Activation */}",  # This is the comment for Fragment Activation
    "{/* Reputation Milestones */}",
    "{/* Order Details Modal */}"
]

indices = []
for m in markers:
    for i, l in enumerate(lines):
        if m in l:
            indices.append(i)
            break

blocks = {}
blocks['tier'] = lines[indices[0]:indices[1]]
blocks['captured'] = lines[indices[1]:indices[2]]
blocks['checkout'] = lines[indices[2]:indices[3]]
blocks['acquisition'] = lines[indices[3]:indices[4]]
blocks['promo'] = lines[indices[4]:indices[5]]
blocks['reputation'] = lines[indices[5]:indices[6]]

def replace_title(block, old_title, new_title):
    for i, l in enumerate(block):
        if old_title in l:
            block[i] = l.replace(old_title, new_title)
    return block

blocks['acquisition'] = replace_title(blocks['acquisition'], 'Acquisition History', 'Order History')
blocks['captured'] = replace_title(blocks['captured'], 'Captured Aesthetics', 'Wishlist')
blocks['checkout'] = replace_title(blocks['checkout'], 'Checkout Protocols', 'Delivery Addresses')
blocks['tier'] = replace_title(blocks['tier'], 'Tier Merits Matrix', 'Loyalty Benefits')
blocks['promo'] = replace_title(blocks['promo'], 'Fragment Activation', 'Promo Codes')
blocks['reputation'] = replace_title(blocks['reputation'], 'Reputation Milestones', 'Achievements')

new_content = lines[:indices[0]] + \
    blocks['acquisition'] + \
    blocks['captured'] + \
    blocks['checkout'] + \
    blocks['tier'] + \
    blocks['promo'] + \
    blocks['reputation'] + \
    lines[indices[6]:]

with open('components/Profile.tsx', 'w') as f:
    f.writelines(new_content)

print("Done")
