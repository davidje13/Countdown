set -e

BASE_DIR="$(dirname "$0")";

function download_words() {
	URL="$1";
	FILE="$2";
	if [[ ! -f "$FILE" ]]; then
		mkdir -p temp;
		curl "$URL" > temp/wb.deb;
		cd temp;
		ar -x wb.deb;
		tar -xvf data.tar.*;
		cd -;
		mv "temp/usr/share/dict"/* "$FILE";
		rm -rf temp;
	fi;
}

# https://packages.debian.org/sid/wbritish-small
download_words \
	"http://ftp.uk.debian.org/debian/pool/main/s/scowl/wbritish-small_2018.04.16-1_all.deb" \
	"british-english-small";

## https://packages.debian.org/sid/wbritish
#download_words \
#	"http://ftp.uk.debian.org/debian/pool/main/s/scowl/wbritish_2018.04.16-1_all.deb" \
#	"british-english";

# https://packages.debian.org/sid/wbritish-large
download_words \
	"http://ftp.uk.debian.org/debian/pool/main/s/scowl/wbritish-large_2018.04.16-1_all.deb" \
	"british-english-large";

# https://packages.debian.org/sid/wbritish-huge
download_words \
	"http://ftp.uk.debian.org/debian/pool/main/s/scowl/wbritish-huge_2018.04.16-1_all.deb" \
	"british-english-huge";

## https://packages.debian.org/sid/wbritish-insane
#download_words \
#	"http://ftp.uk.debian.org/debian/pool/main/s/scowl/wbritish-insane_2018.04.16-1_all.deb" \
#	"british-english-insane";

grep -x '[a-z]*' british-english-small | sort > british-english-small-filtered;
grep -x '[a-z]*' british-english-large | sort > british-english-large-filtered;
grep -x '[a-z]*' british-english-huge | sort > british-english-huge-filtered;

cat british-english-small-filtered \
| node "$BASE_DIR/word-loader.js" "commonWords" > "$BASE_DIR/../solvers/letters/generated-data-common.js";

comm -23 british-english-large-filtered british-english-small-filtered \
| node "$BASE_DIR/word-loader.js" "standardWords" > "$BASE_DIR/../solvers/letters/generated-data-standard.js";

comm -23 british-english-huge-filtered british-english-large-filtered \
| node "$BASE_DIR/word-loader.js" "rareWords" > "$BASE_DIR/../solvers/letters/generated-data-rare.js";
