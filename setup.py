from setuptools import setup, find_packages

setup(
    name='camus-chat',
    version='0.1.dev6',
    description='Peer-to-peer video chat using WebRTC',
    long_description=open('README.rst').read(),
    long_description_content_type="text/markdown",
    url='https://github.com/mrgnr/camus',
    author='Morgan Robertson',
    author_email='mrgnr@pm.me',
    license='GPL-3.0',
    packages=find_packages(),
    include_package_data=True,
    install_requires=[
        'quart==0.11.5',
        'bootstrap-flask==1.3.1',
        'flask-wtf==0.14.3',
        'pyee==7.0.2',
        'python-slugify==4.0.0',
        'werkzeug==1.0.1',
    ],
    classifiers=[
        'License :: OSI Approved :: GNU General Public License v3 or later (GPLv3+)',
        'Environment :: Web Environment',
        'Programming Language :: Python :: 3.7',
        'Programming Language :: Python :: 3.8',
        'Topic :: Communications :: Conferencing',
        'Topic :: Multimedia :: Video',
    ],
    python_requires='>=3.7',
    scripts=['bin/camus'],
)
