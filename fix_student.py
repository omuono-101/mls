# Read the file
with open('c:/Users/Administrator/OneDrive/Desktop/restapi/mls-main/frontend/src/dashboards/StudentDashboard.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Find and replace the broken line
old_code = 'await api.post(ssessments///);'
new_code = 'await api.post(`assessments/${assessmentId}/${!currentStatus ? \'complete\' : \'incomplete\'}/`);'

if old_code in content:
    content = content.replace(old_code, new_code)
    with open('c:/Users/Administrator/OneDrive/Desktop/restapi/mls-main/frontend/src/dashboards/StudentDashboard.tsx', 'w', encoding='utf-8') as f:
        f.write(content)
    print("Fixed!")
else:
    print("Pattern not found. Looking for similar patterns...")
    # Find lines containing 'api.post' and 'ssessments'
    import re
    matches = re.findall(r'.*api\.post.*ssessments.*', content)
    for m in matches:
        print(f"Found: {repr(m)}")
