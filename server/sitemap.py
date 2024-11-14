import json

with open('../public/sitemap.xml', 'w') as xml_file:
  xml_file.write('<?xml version="1.0" encoding="UTF-8"?>\n')
  xml_file.write('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n')
  xml_file.write('\t<url>\n')
  xml_file.write(f'\t\t<loc>https://boilerclasses.com/</loc>\n')
  xml_file.write(f'\t\t<priority>1</priority>\n')
  xml_file.write('\t</url>\n')

with open('classes_out.json', 'r') as file:
  data = json.load(file)
  mx_terms = 0
  for class_data in data:
    mx_terms = max(mx_terms, len(class_data['terms']))
  for class_data in data:
    with open('../public/sitemap.xml', 'a') as xml_file:
      # xml_file.write('\t<url>\n')
      # xml_file.write(f'\t\t<loc>https://www.boilerclasses.com/detail/{class_data["detailId"]}</loc>\n')
      # xml_file.write(f'\t\t<priority>{round(len(class_data["terms"])/mx_terms, 2)}</priority>\n')
      # xml_file.write('\t</url>\n')
      xml_file.write('\t<url>\n')
      xml_file.write(f'\t\t<loc>https://boilerclasses.com/detail/{class_data["detailId"]}</loc>\n')
      xml_file.write(f'\t\t<priority>{round(len(class_data["terms"])/mx_terms, 2)}</priority>\n')
      xml_file.write('\t</url>\n')


# Add course directory to sitemap
class_codes = ['AAE', 'AAS', 'ABE', 'AD', 'AFT', 'AGEC', 'AGR', 'AGRY', 'AMST', 'ANSC', 'ANTH', 'ARAB', 'ASAM', 'ASEC', 'ASL', 'ASM', 'ASTR', 'AT', 'BAND', 'BCHM', 'BIOL', 'BME', 'BMS', 'BTNY', 'CAND', 'CDIS', 'CE', 'CEM', 'CGT', 'CHE', 'CHM', 'CHNS', 'CLCS', 'CLPH', 'CM', 'CMPL', 'CNIT', 'COM', 'CPB', 'CS', 'CSR', 'DANC', 'EAPS', 'ECE', 'ECET', 'ECON', 'EDCI', 'EDPS', 'EDST', 'EEE', 'ENE', 'ENGL', 'ENGR', 'ENGT', 'ENTM', 'ENTR', 'EPCS', 'FLM', 'FNR', 'FR', 'FS', 'FVS', 'GER', 'GRAD', 'GREK', 'GS', 'GSLA', 'HDFS', 'HEBR', 'HIST', 'HK', 'HONR', 'HORT', 'HSCI', 'HSOP', 'HTM', 'IDE', 'IDIS', 'IE', 'IET', 'ILS', 'IMPH', 'IPPH', 'IT', 'ITAL', 'JPNS', 'JWST', 'KOR', 'LA', 'LALS', 'LATN', 'LC', 'LING', 'MA', 'MCMP', 'ME', 'MET', 'MFET', 'MGMT', 'MSE', 'MSL', 'MUS', 'NRES', 'NS', 'NUCL', 'NUPH', 'NUR', 'NUTR', 'OBHR', 'OLS', 'PES', 'PHIL', 'PHPR', 'PHRM', 'PHSC', 'PHYS', 'POL', 'PSY', 'PTGS', 'PUBH', 'REL', 'RUSS', 'SA', 'SCI', 'SCLA', 'SFS', 'SLHS', 'SOC', 'SPAN', 'STAT', 'SYS', 'TDM', 'TECH', 'THTR', 'TLI', 'VCS', 'VIP', 'VM', 'WGSS']
with open('../public/sitemap.xml', 'a') as xml_file:
  xml_file.write('\t<url>\n')
  xml_file.write(f'\t\t<loc>https://www.boilerclasses.com/dir/</loc>\n')
  xml_file.write(f'\t\t<priority>1</priority>\n')
  xml_file.write('\t</url>\n')

  for class_code in class_codes:
    xml_file.write('\t<url>\n')
    xml_file.write(f'\t\t<loc>https://boilerclasses.com/dir/{class_code}</loc>\n')
    xml_file.write(f'\t\t<priority>1</priority>\n')
    xml_file.write('\t</url>\n')


with open('../public/sitemap.xml', 'a') as xml_file:
  xml_file.write('</urlset>\n')
