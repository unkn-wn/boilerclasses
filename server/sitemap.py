import json

with open('../public/sitemap.xml', 'w') as xml_file:
    xml_file.write('<?xml version="1.0" encoding="UTF-8"?>\n')
    xml_file.write('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n')

with open('classes_out.json', 'r') as file:
  data = json.load(file)
  mx_terms = 0
  for class_data in data:
    mx_terms = max(mx_terms, len(class_data['terms']))
  for class_data in data:
    with open('../public/sitemap.xml', 'a') as xml_file:
      xml_file.write('\t<url>\n')
      xml_file.write(f'\t\t<loc>https://www.boilerclasses.com/detail/{class_data["detailId"]}</loc>\n')
      xml_file.write(f'\t\t<priority>{round(len(class_data["terms"])/mx_terms, 2)}</priority>\n')
      xml_file.write('\t</url>\n')

with open('../public/sitemap.xml', 'a') as xml_file:
  xml_file.write('</urlset>\n')
