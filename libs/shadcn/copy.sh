#!/bin/bash

# Function to check if a directory exists, delete its contents if it does,
# or create it if it doesn't exist
check_dir() {
  if [ -d "$1" ]; then
    # If it exists, delete its contents
    rm -rf "$1"/*
  else
    # If it doesn't exist, create it
    mkdir "$1"
  fi
}

# Define the source and target directories
script_dir=$(dirname "$0")
doc_src_dir="$script_dir/temp/apps/www/content/docs/components"
doc_target_dir="$script_dir/docs"
example_src_dir="$script_dir/temp/apps/www/registry/default/example"
example_target_dir="$script_dir/examples"

# Clone the repository into the current directory
git clone https://github.com/shadcn-ui/ui "$script_dir/temp" --depth 1

# Check if the target directory exists
check_dir "$doc_target_dir"
check_dir "$example_target_dir"

# Copy the contents of the source directory to the target directory
cp -r "$doc_src_dir"/* "$doc_target_dir"
cp -r "$example_src_dir"/* "$example_target_dir"

# Delete the temp dir
rm -rf "$script_dir/temp"
