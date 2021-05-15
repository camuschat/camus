# -- Project information -----------------------------------------------------

project = 'Camus'
copyright = '2021, Morgan Robertson'
author = 'Morgan Robertson'


# -- General configuration ---------------------------------------------------

extensions = [
    'sphinx.ext.autosectionlabel',
]
autosectionlabel_prefix_document = True
templates_path = ['_templates']
exclude_patterns = ['_build', 'Thumbs.db', '.DS_Store']


# -- Options for HTML output -------------------------------------------------

html_static_path = ['_static']
html_theme = 'alabaster'
html_theme_options = {
    'github_user': 'mrgnr',
    'github_repo': 'camus',
    'github_banner': True,
    'github_button': False,
    'show_relbar_bottom': True,
    'show_powered_by': False,
    'extra_nav_links': {
        'Demo': 'https://camus.chat',
        'Source code': 'https://github.com/camuschat/camus',
        'Issue tracker': 'https://github.com/camuschat/camus/issues',
        'Discussions': 'https://github.com/camuschat/camus/discussions',
        'Donate': 'https://liberapay.com/mrgnr',
    },
}
