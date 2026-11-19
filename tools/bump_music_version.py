# -*- coding: utf-8 -*-
"""一次性脚本：把仓库里的音源版本从 1.3.0 升到 1.3.1。

只替换「版本号 / 更新日期 / 日志行 / 启动日志」这几处固定文本，
其余字节完全不动 —— 避免整文件重传导致取链逻辑被误改。
"""
import io
import sys

FILES = ['yyzone-music-source.js', 'YY Zone音源.js']

OLD_VER = ' * @version 1.3.0'
NEW_VER = ' * @version 1.3.1'
OLD_DATE = ' * @update 2026-11-09'
NEW_DATE = ' * @update 2026-11-19'
OLD_LOG = ' *   - 1.3.0 (2026-11-09) '
NEW_LOG = (
    ' *   - 1.3.1 (2026-11-19) 文件名统一为 yyzone-music-source.js（仓库与安装目录都不再带 lx 字样）；'
    '取链逻辑零改动，只把「版本号与文件名约定」跟源库对齐，方便客户端版本比对\n'
    + OLD_LOG
)
OLD_BOOT = 'YY Zone🎵音源 v1.3.0 已加载'
NEW_BOOT = 'YY Zone🎵音源 v1.3.1 已加载'


def patch(s):
    s = s.replace(OLD_VER, NEW_VER, 1)
    s = s.replace(OLD_DATE, NEW_DATE, 1)
    s = s.replace(OLD_LOG, NEW_LOG, 1)
    s = s.replace(OLD_BOOT, NEW_BOOT, 1)
    return s


def main():
    changed = False
    for f in FILES:
        with io.open(f, encoding='utf-8') as fh:
            src = fh.read()
        out = patch(src)
        if out != src:
            with io.open(f, 'w', encoding='utf-8', newline='') as fh:
                fh.write(out)
            print('patched:', f)
            changed = True
        else:
            print('unchanged:', f)
    return 0 if changed else 0


if __name__ == '__main__':
    sys.exit(main())
